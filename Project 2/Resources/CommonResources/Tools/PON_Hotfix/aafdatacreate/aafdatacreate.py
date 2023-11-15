#!/usr/local/bin/python2.7
# encoding: utf-8
'''
aafdatacreate -- AAF Data Creation Facility

aafdatacreate has following features:
    Translates PON.XL to standard PON files
    Fetches connection info and global variables from DDP and puts them in to pon files
    Lists all errors in to a error sheet



@author:     Sanjeeth Nayak, Waldek Herka,  Navneet Kaur

@copyright:  2016 Amadeus Services Limited. All rights reserved.

@license:    Apache License 2.0

@contact:    sanjeeth.nayak@amadeus.com, waldek.herka@amadeus.com, navneet.kaur@amadeus.com
@deffield    updated: 01/12/2016
'''

import sys
import os
import re
import xlrd
import glob
import json
import traceback
from datetime import datetime
import subprocess
import multiprocessing
from multiprocessing import Pool
from ConfigParser import ConfigParser
import datasetup
from datasetup import RANDOM_PREFIX
import aafpostresults
import workflow
import requests
from requests_negotiate_sspi import HttpNegotiateAuth

from argparse import ArgumentParser
from argparse import RawDescriptionHelpFormatter
import logging
import shutil
from workflow import ProcessingBlockFactory, ProcessingBlock, LogInBlock, DatBlock, InitBlock, FinalizeBlock, \
    GlobalVarsBlock
from datasetup import get_dates_range_new, change_date_format

logger = None
__all__ = []
__version__ = 0.3
__date__ = '2016-09-09'
__updated__ = '2016-15-09'

DEBUG = 0
TESTRUN = 0
PROFILE = 1
MULTIPROCESSING = 1

TRUSTED_MODE = "TRUSTED_MODE"
date_population_in_iteration_file = False
SCRIPT_NAME_CREATEDATA = "createdata.bat"
INJECTOR_SCRIPT_NAME = "injector.bat"
PON_RANDOM_DATA_FILE_EXT = 'ini'
RETURN_AS_OUTPUT_VARIABLE = "Y"

PERL_MAP_RE = re.compile(r'(\w+)\s+\{(.*?)[\}]', re.IGNORECASE | re.MULTILINE | re.DOTALL)
PERL_MAP_SECTION_DEFINEVARS = "DefineVars"
PERL_MAP_SECTION_AAFVARS = "AAFVars"
PERL_MAP_SECTION_PONXLSVARS = "PONXlsVars"
PERL_MAP_SECTION_ERRORS = "Errors"
PERL_MAP_FILE_DEFAULT_EXT = 'ini'

PON_FILE_DEFAULT_EXT = 'pon'

WORKSHEET_NAME_HOW_TO = 'How to use'
WORKSHEET_NAMES = [WORKSHEET_NAME_HOW_TO, 'GLOBAL_VARS', 'CREATE_PNR', 'CREATE_PNR_ETK',
                   'AGENT_DEFAULT', 'IDENTIFY_CUSTOMER', 'IDENTIFY_GROUP',
                   'PNR_RETRIEVE', 'WAIT', 'RES', 'EDI', 'NGD', 'RETURN_KEYS']


def parse_perl_map_data(perl_map_data):
    ret_val = {}
    for f in PERL_MAP_RE.findall(perl_map_data):
        ret_val[f[0]] = {}
        for ff in f[1].split('\n'):
            l = ff.rstrip(',\'')
            if l:
                k, v = l.split('=>')
                ret_val[f[0]].update({k.strip(): v.strip().strip('"')})
    return ret_val


'''
TODO: Finish it off..
'''


def generate_rollback_injector_scenarios_direct(create_data_processing_blocks_per_session, result_data,
                                                config_file_path, output_dir):
    global logger
    if not os.path.exists(config_file_path):
        raise Exception("Configuration file not found: {}".format(str(config_file_path)))

    transactions_config = ProcessingBlock.parse_transaction_config(config_file_path)

    injector_scenarios = []
    rollback_blocks_per_session = {}
    for session_id, processing_blocks in create_data_processing_blocks_per_session.iteritems():
        rollback_blocks_per_session[session_id] = []

        init_block = ProcessingBlockFactory.createProcessingBlock("INIT")
        finalize_block = ProcessingBlockFactory.createProcessingBlock("FINALIZE")

        finalize_block.append(('OUTPUT_DIR', output_dir))
        finalize_block.append(('SESSION_NAME', "{}.rollback".format(session_id)))
        rollback_blocks_per_session[session_id].append(init_block)
        rollback_blocks_per_session[session_id].append(finalize_block)

        for processing_block in processing_blocks:
            if GlobalVarsBlock is type(processing_block):
                rollback_blocks_per_session[session_id].append(processing_block)

        login_block = \
        [processing_block for processing_block in processing_blocks if LogInBlock is type(processing_block)][0]
        rollback_blocks_per_session[session_id].append(
            [processing_block for processing_block in processing_blocks if DatBlock is type(processing_block)][0])
        rollback_blocks_per_session[session_id].append(login_block)

        '''
        Actual RollbackBlock:
        '''
        pax_data = {processing_block.unique_id: {'pax': getattr(processing_block, 'pax'),
                                                 'seg': getattr(processing_block, 'seg')} for processing_block in
                    processing_blocks if hasattr(processing_block, 'pax') \
                    and hasattr(processing_block, 'seg')}

        for processing_block in processing_blocks:
            if processing_block.unique_id in result_data.get(session_id).get('RESULT_DATA',
                                                                             {}) and 'PNRS' in result_data.get(
                    session_id).get('RESULT_DATA').get(processing_block.unique_id):
                if pax_data.get(processing_block.unique_id):
                    pax_data.get(processing_block.unique_id)['pnrs'] = result_data.get(session_id).get('RESULT_DATA',
                                                                                                       {}).get(
                        processing_block.unique_id, {}).get('PNRS')

        rollback_block = ProcessingBlockFactory.createProcessingBlock("ROLLBACK")
        rollback_block.append(['AIRLINE', login_block.get('ORGANISATION')[1]])

        if pax_data:
            rollback_block.create_pnr_parameters = pax_data
        rollback_blocks_per_session[session_id].append(rollback_block)

        [processing_block.expand_vars(sequence=processing_blocks) for processing_block in
         rollback_blocks_per_session[session_id]]

        messages = []
        for processing_block in rollback_blocks_per_session[session_id]:
            message = processing_block.get_message(transactions_config=transactions_config)
            if message:
                messages.append(message)

        if not os.path.exists(os.path.join(output_dir, 'log')):
            os.makedirs(os.path.join(output_dir, 'log'))

        scenario_file_path = os.path.join(output_dir, 'log', "{}.rollback.play".format(session_id))
        with open(scenario_file_path, 'w') as scenario_file:
            scenario_file.write('\n'.join(messages))
        injector_scenarios.append(scenario_file_path)

    return injector_scenarios, rollback_blocks_per_session
def passwordCleanup(logpath):
    logfiles = os.listdir(logpath)
    for eachlogfiles in logfiles:
        readlogfile = open( logpath +'/'+eachlogfiles,'r')
        readlogdata = readlogfile.read()
        passwordrgx = re.search(r"BLB\+\S\+E\+(.*)'", readlogdata)
        if str(passwordrgx) != 'None':
            password = passwordrgx.group(1)
            logfile = open( logpath +'/'+eachlogfiles,'w')
            readlogdata = readlogdata.replace(password,'#########')
            logfile.write(readlogdata)

def generate_injector_scenarios_direct(ddp_data, pon_xls_data, config_file_path, output_dir, jfe_connection_data=None,
                                       file_psg_data=True):
    injector_scenarios = []
    processing_blocks_per_session = {}
    if not os.path.exists(config_file_path):
        raise Exception("Configuration file not found: {}".format(str(config_file_path)))

    transactions_config = ProcessingBlock.parse_transaction_config(config_file_path)
    for session_id in ddp_data:
        trusted_mode = False
        connection = ddp_data.get(session_id)
        '''
        PON XLS data is a list of dictionaries, where the key acts as a session name:
        [{'iteration1': [..]}, {'iteration2': [..]},..]
        '''
        session_data = [item for item in pon_xls_data if item.get(session_id.upper())]
        if not session_data:
            raise Exception("There is no configuration for session/iteration inside PON XLS for: {}".format(session_id))
        '''
        Let's build the raw transitions:
        '''
        transitions = []
        add_to_ini = []
        for processing_block_data in session_data[0].get(session_id.upper()):         ############# WHAT IS session_data[0] ?????????????????????????????????????
            function_name = processing_block_data[0]
            if TRUSTED_MODE == function_name:
                trusted_mode = True
            current_transition = [['__name__', function_name], ]
            [current_transition.append([name, value]) for name, value, to_be_stored in processing_block_data[1]] ################ how is processing_block_data[1] is 'GLOBAL VARS" ??????????????
            transitions.append(current_transition)
            '''
            TODO:
            ADD_TO_INI has to be tackled explicitly:
            '''
            add_to_ini.extend([name for name, value, to_be_stored in processing_block_data[1] if to_be_stored])

        add_to_ini = list(set(add_to_ini))
        '''
        Let's create the pipeline:
        '''
        processing_blocks = ProcessingBlockFactory.createProcessingBlocks(transitions)
        airline_code = None
        for block in processing_blocks:
            airline_code = block.get('carrier')
            if airline_code:
                airline_code = airline_code[1]
                break

        date_population_in_iteration_file = False                        ################### COMMAND ADDED -
        #print processing_blocks
        '''
        for block in processing_blocks:                                ################### FUNCTION ADDED - To change the format of date
            #date_search = block.search("DATE")
            date_population_in_iteration_file = True
            if 'DATE' in block:    #date_search = block.search("DATE")
                print block
            #if date_search:
                date_population_in_iteration_file = True
                break                                     ################################## break is used so that it only check for global vars and not other sections #######
            '''
        '''
        We need the some more GLOBAL VARS from JFE connection data:
        '''
        if not jfe_connection_data:
            connection_data_path = os.path.join(os.path.dirname(os.path.realpath(__file__)), "JFElogins.properties")
            if not os.path.exists(connection_data_path):
                logger.error("Connection data properties file: {} does not exist.".format(connection_data_path))
                raise Exception("Connection data properties file: {} does not exist.".format(connection_data_path))

            connection = connection or datasetup.get_properties(connection_data_path, 'CONNECTION').get('CONNECTION')

            logger.debug("Getting connection details for airline: {} ".format(airline_code))
            jfe_connection_data = datasetup.get_properties(connection_data_path, airline_code)
            if not jfe_connection_data:
                logger.error(
                    "Missing connection data for: {} in properties file: {}".format(airline_code, connection_data_path))       ######### logger.error #####################
                raise Exception(                                                                                                ########## Exception ###############
                    "Missing connection data for: {} in properties file: {}".format(airline_code, connection_data_path))


        define_vars = datasetup.get_dataset(airline_code, connection, jfe_connection_data) ########## get_dataset ####################
        define_vars['CONNECTION'] = connection

        global_vars = ProcessingBlockFactory.createProcessingBlock("GLOBAL_VARS")
        global_vars.extend([[k, v] for k, v in define_vars.iteritems()])
        processing_blocks.insert(0, global_vars)

        add_to_ini_block = ProcessingBlockFactory.createProcessingBlock("ADD_TO_INI")
        add_to_ini_block.extend([[k, None] for k in add_to_ini])
        processing_blocks.append(add_to_ini_block)

        _airline_code_, _loc_type_, _loc_code_, _site_type_, _site_code_, _loc_cat_code_, _loc_cat_index_ = define_vars.get(
            'PON_WORKSTATIONID').split('/')[0:7]
        pon_password_length = len(define_vars.get('PON_PASSWORD') or '')
        define_vars['PON_PASSWORD'] = define_vars.get('PON_PASSWORD').replace(":", "\:").replace("*", "\*").replace("+",
                                                                                                                    "\+")

        OFFICEID = define_vars.get('PON_OFFICELDCS')
        if OFFICEID:
            OFFICEID = ("ABI++:" + OFFICEID + "'")

        BLBSEG = define_vars.get('PON_PASSWORD')
        if BLBSEG:
            #Start of CyberArk Changes ----->SOAP Call to CyberArk
            headers = {'content-type': 'text/xml'}
            s_ObjectAddress = BLBSEG

            cyberark_param_path = os.path.join(os.path.dirname(os.path.realpath(__file__)), "cfg/cyberarkparams.ini")

            if not os.path.exists(cyberark_param_path):
                logger.error("Cyber ark param path file: {} does not exist.".format(cyberark_param_path))
                raise Exception("Cyber ark param path file: {} does not exist.".format(cyberark_param_path))

            cyberarkParamFile = open(cyberark_param_path,'r')
            cyberarkParams = cyberarkParamFile.readlines()
            for eachCyberarkParams in cyberarkParams:
                if "SOAP_ENVELOP" in eachCyberarkParams:
                    soapbody = eachCyberarkParams.replace('SOAP_ENVELOP = ','').replace('SOAP_ENVELOP= ','').replace(
                        'SOAP_ENVELOP=','')
                if 'SOAP_ADDRESS' in eachCyberarkParams:
                    soapaddress = eachCyberarkParams.replace('SOAP_ADDRESS = ', '').replace('SOAP_ADDRESS= ', '').replace(
                        'SOAP_ADDRESS=', '')
            soapbody = soapbody.replace('#s_ObjectAddressReplaceInPONFramework#',s_ObjectAddress)
            CyberArkResponse = requests.post(soapaddress, auth=HttpNegotiateAuth(),data=soapbody, headers=headers)
            cyberArkPassword = (CyberArkResponse.content)
            #closing the connection
            CyberArkResponse.close()		
            if '<soap:Fault>' in cyberArkPassword:
                # This means something went wrong.
                raise CLIError("Issue while Getting Password. Contact PON dev team:" + "\n"+cyberArkPassword)
            elif '<Content>' in cyberArkPassword:
                    cyberArkPassword = cyberArkPassword.split('<Content>')[1].split('</Content>')[0]
            else:
                raise CLIError("Issue while Getting Password. Contact PON dev team:" + "\n" + cyberArkPassword)
            pon_password_length = len(cyberArkPassword)
            cyberArkPassword = cyberArkPassword.replace(":", "\:").replace("*", "\*").replace("+","\+")
            #End of CyberArk Changes

            BLBSEG = ("PSW+CLE++CUR'BLB+" + str(pon_password_length) + "+E+" + cyberArkPassword + "'")

            login_details = {'USERID': define_vars.get('PON_USERNAME'),
                         'ORGANISATION': define_vars.get('PON_AIRLINECODE'),
                         'OFFICEID': OFFICEID or '',
                         'LOCTYPE': _loc_type_,
                         'LOCCODE': _loc_code_,
                         'LOCCATCODE': _loc_cat_code_,
                         'LOCCATINDEX': _loc_cat_index_,
                         'SITETYPE': _site_type_,
                         'SITECODE': _site_code_,
                         'DUTYCODE': define_vars.get('PON_DUTYCODE'),
                         'SHALEN': str(pon_password_length),
                         'SHAPWD': cyberArkPassword,
                         'BLBSEG': BLBSEG or '',
                         'LASTIP': '',
                         'LOGINTYPE': define_vars.get('PON_LOGINTYPE') or 'HOS'
                         }

        init_block = ProcessingBlockFactory.createProcessingBlock("INIT")
        finalize_block = ProcessingBlockFactory.createProcessingBlock("FINALIZE")

        finalize_block.append(('OUTPUT_DIR', output_dir))
        finalize_block.append(('SESSION_NAME', session_id))

        login_details_block = ProcessingBlockFactory.createProcessingBlock("LOGIN")
        login_trusted_details_block = ProcessingBlockFactory.createProcessingBlock("LOGIN_TRUSTED")
        dat_block = ProcessingBlockFactory.createProcessingBlock("DAT")

        dat_block.extend([[k, v] for k, v in login_details.iteritems()])
        login_details_block.extend([[k, v] for k, v in login_details.iteritems()])
        login_trusted_details_block.extend([[k, v] for k, v in login_details.iteritems()])

        processing_blocks.insert(0, dat_block)
        if trusted_mode:
            processing_blocks.insert(0, login_trusted_details_block)
        else:
            processing_blocks.insert(0, login_details_block)
        processing_blocks.insert(0, finalize_block)
        processing_blocks.insert(0, init_block)

        [processing_block.expand_vars(sequence=processing_blocks) for processing_block in processing_blocks]

        messages = []
        for processing_block in processing_blocks:
            message = processing_block.get_message(transactions_config=transactions_config)
            if message:
                messages.append(message)

        if not os.path.exists(os.path.join(output_dir, 'log')):
            os.makedirs(os.path.join(output_dir, 'log'))

        scenario_file_path = os.path.join(output_dir, 'log', "{}.play".format(session_id))     ############# Iteration1.play file ############
        with open(scenario_file_path, 'w') as scenario_file:
            scenario_file.write(u'\n'.join(messages).encode('utf-8'))
        injector_scenarios.append(scenario_file_path)

        processing_blocks_per_session[session_id] = processing_blocks

        '''
        Dump PSG files:
        '''
        if file_psg_data:
            psg_file_path = os.path.join(output_dir, "{}.{}".format(session_id, PON_FILE_DEFAULT_EXT))
            open(psg_file_path, 'w').close()

            with open(psg_file_path, 'w') as psg_fl:
                psg_fl.write(
                    u'\n\n'.join([unicode(block) for block in processing_blocks if unicode(block)]).encode('utf-8'))

    return injector_scenarios, processing_blocks_per_session


def process_result_data(injector_scenarios, processing_blocks_per_session):
    get_session_name = lambda x: os.path.splitext(os.path.basename(x))[0]
    get_path_to_tts_output = lambda x: os.path.join(os.path.dirname(x), "{}.play.edi".format(get_session_name(x)))
    get_path_to_result_data = lambda x: os.path.join(os.path.dirname(x), "{}.result.data".format(get_session_name(x)))
    get_path_to_pnr_data = lambda x: os.path.join(os.path.dirname(x), "{}.pnr.data".format(get_session_name(x)))

    ret_val = {}
    for injector_scenario in injector_scenarios:
        '''
        injector_scenario:
        - iteration1.play
        raw tts output:
        - iteration1.play.edi
        edi messages(bodies) correlated with processing blocks:
        - iteration1.pon.result.data
        pnrs:
        - iteration1.pon.pnr.data
        '''
        session_name = get_session_name(injector_scenario)
        tts_output_path = get_path_to_tts_output(injector_scenario)
        result_data_path = get_path_to_result_data(injector_scenario)
        pnr_data_path = get_path_to_pnr_data(injector_scenario)

        processing_blocks = processing_blocks_per_session.get(session_name)

        ret_val[session_name] = {}
        with open(pnr_data_path) as pnr_data_fl:
            ret_val[session_name].update({'PNRS': json.loads(pnr_data_fl.read())})

        with open(result_data_path, 'r') as result_data_fl:
            result_data = json.loads(result_data_fl.read())
            for processing_block in processing_blocks:
                if processing_block.unique_id in result_data:
                    result_data = processing_block.process_result_data(result_data)
            ret_val[session_name]['RESULT_DATA'] = result_data
        '''
        TODO:
        - store parameters in the same order as they appear in the iteration/pon xls (Issue 35)
        '''

        '''
        Identify the AddToIni block and resolve the values:
        '''
        add_to_ini_keys = set()
        [[add_to_ini_keys.add(item[0]) for item in processing_block] for processing_block in processing_blocks if
         "ADD_TO_INI" == processing_block.__identifier__]

        values_to_be_stored = {}
        for processing_block in processing_blocks[0:-1]:
            for param_to_be_stored in add_to_ini_keys:
                matched_values = processing_block.get(param_to_be_stored, first_only=False)
                if matched_values:
                    if param_to_be_stored not in values_to_be_stored:
                        values_to_be_stored[param_to_be_stored] = []
                    values_to_be_stored[param_to_be_stored].extend([m[1] for m in matched_values])
        ret_val[session_name]['STORED_PARAMS'] = values_to_be_stored
    return ret_val


class CLIError(Exception):
    '''Generic exception to raise and log different fatal errors.'''

    def __init__(self, msg):
        super(CLIError).__init__(type(self))
        self.msg = "E: %s" % msg

    def __str__(self):
        return self.msg

    def __unicode__(self):
        return self.msg


def parse_ddp_data(ddp_file_path):
    '''
    The aim here is to get the list of connections from DDP:
    '''
    ret_val = {}
    SESSION_NAME_TEMPLATE = "iteration{}"
    CONNECTION_COLUMN_NAME = "CONNECTION"

    if not os.path.exists(ddp_file_path):
        raise Exception("Specified path is not valid: {}".format(ddp_file_path))

    load_sheet = xlrd.open_workbook(ddp_file_path)
    load_sheet_data = []
    work_sheets = load_sheet.sheets()
    if not work_sheets:
        raise Exception("Specified file does not seem to contain any data: {}".format(ddp_file_path))

    connection_column_indices = [row_idx for row_idx in range(0, work_sheets[0].ncols) if
                                 CONNECTION_COLUMN_NAME == str(work_sheets[0].cell(0, row_idx).value).strip().upper()]

    if not connection_column_indices:
        raise Exception("Specified file does not contain the CONNECTION column: {}".format(ddp_file_path))

    if len(connection_column_indices) > 1:
        raise Exception("Specified file does not contain more than one CONNECTION column: {}".format(ddp_file_path))

    connection_column_index = connection_column_indices[0]

    for row_idx in range(1, work_sheets[0].nrows):
        session_name = work_sheets[0].cell(row_idx, 0).value
        if float == type(session_name) and 0 == session_name - int(session_name):
            session_name = int(session_name)
        session_name = SESSION_NAME_TEMPLATE.format(str(session_name).strip().upper())
        connection = work_sheets[0].cell(row_idx, connection_column_index).value
        ret_val[session_name] = connection.strip().strip('"').strip("'")

    return ret_val


def parse_pon_xls_data(pon_xls_file_path, permissive=False):
    '''
    ['Function','key','value', 'Return as variable',],
    '''
    if not os.path.exists(pon_xls_file_path):
        raise Exception("Specified path is not valid: {}".format(pon_xls_file_path))

    def _apend_processing_block_(processing_blocks, current_function_name, key, value, store):
        #print(processing_blocks)
        if current_function_name:
            processing_blocks.append([current_function_name, []])
        processing_blocks[-1][1].append([key, value, store])

    load_sheet = xlrd.open_workbook(pon_xls_file_path)
    load_sheet_data = []
    for work_sheet in load_sheet.sheets():
        if WORKSHEET_NAME_HOW_TO.upper() == work_sheet.name.upper():
            continue
        session_name = work_sheet.name.upper().strip()
        processing_blocks = []
        row_idx = 1
        while row_idx < work_sheet.nrows:
            function_name = str(work_sheet.cell(row_idx, 0).value).strip().upper()
            keyarray, valuearray, storearray = [], [], []
            if ":" in function_name:                                                              ##################### section tag added by sanjeeth ####################
                function_name = function_name.split(":")
                function_name = [function_name[0], int(function_name[1])]
                for nextfunction_idx in range(row_idx, work_sheet.nrows):
                    keyarray.append(unicode(work_sheet.cell(nextfunction_idx, 1).value).strip())
                    valuearray.append(work_sheet.cell(nextfunction_idx, 2).value)
                    storearray.append(unicode(work_sheet.cell(nextfunction_idx, 3).value).strip().upper())
                    if nextfunction_idx >= (work_sheet.nrows - 1):
                        row_idx = nextfunction_idx
                        break
                    else:
                        next_function_name = str(work_sheet.cell(nextfunction_idx + 1, 0).value).strip().upper()
                        if next_function_name:
                            row_idx = nextfunction_idx
                            break
            else:
                function_name = [function_name, 1]
                pattern = r'[$]{1}[\w]{4}'  ################################ CODE CHANGES - SECOND - ASKED BY SANJEETH
                key_date = unicode(work_sheet.cell(row_idx, 2).value).strip().upper()
                try:
                    find_date_pattern = unicode(re.search(pattern, key_date).group())
                except AttributeError:
                    find_date_pattern = None

                if find_date_pattern == u'$DATE' and len(key_date.split('_')) == 2:
                    date_format = key_date.split('_')[1]
                    try:
                        check = unicode(re.search(r'[!@#%^&*()+= ]', key_date).group())
                    except AttributeError:
                        check = None
                    if not check:
                        offset_pattern = r'[-]{0,1}[\d]{1,5}'
                        try:
                            date_offset = int(re.search(offset_pattern, key_date).group())
                            keyarray.append(unicode(work_sheet.cell(row_idx, 1).value).strip())
                            valuearray.append(get_dates_range_new(datetime.now(), date_offset,
                                                                  date_format=change_date_format(date_format)))
                            storearray.append(unicode(work_sheet.cell(row_idx, 3).value).strip().upper())
                        except AttributeError, ValueError:
                            logger.error("offset/date_format '{}' is not of valid format".format(key_date))
                            raise CLIError("offset/date_format '{}' is not of valid format.\nAccepted formats must have Date: DD , Month : MM/MMM/Month and Year : YYYY/YY in any order. Characters accepted as delimiters in date format are     ' : '  '/'   '\\' '-'  ".format(key_date))
                    else:
                        logger.error("offset/date_format '{}' is not of valid format".format(key_date))
                        raise CLIError("offset/date_format '{}' is not of valid format.\nAccepted formats must have Date: DD , Month : MM/MMM/Month and Year : YYYY/YY in any order. Characters accepted as delimiters in date format are     ' : '  '/'  '\\'  '-'  ".format(key_date))
                else:
                    keyarray.append(unicode(work_sheet.cell(row_idx, 1).value).strip())
                    valuearray.append(work_sheet.cell(row_idx, 2).value)
                    storearray.append(unicode(work_sheet.cell(row_idx, 3).value).strip().upper())

            keylen = len(keyarray)

            for mul_idx in range(0, function_name[1]):
                _apend_processing_block_(processing_blocks, function_name[0], keyarray[0],valuearray[0],bool(storearray[0] in ["Y", "YES", "TRUE", "1"]))
                if not keylen <= 1:
                    for len_idx in range(1, keylen):
                        _apend_processing_block_(processing_blocks, "", keyarray[len_idx],valuearray[len_idx],bool(storearray[len_idx] in ["Y", "YES", "TRUE", "1"]))
            row_idx = row_idx + 1
        load_sheet_data.append({session_name: processing_blocks})
    return load_sheet_data


def run_create_data(args):
    file_path, local_createdata_path, batch_files_location, batch_filetoprocess = args
    datafile = os.path.basename(str(file_path))
    cmd_line = '{} {} {}'.format(os.path.join(batch_files_location, batch_filetoprocess),
                                 os.path.join(local_createdata_path, 'etc').replace(':', '#'),
                                 datafile)
    print("Calling :{}".format(cmd_line))
    p = subprocess.Popen(cmd_line, shell=True, stdin=subprocess.PIPE, stdout=subprocess.PIPE)
    out, err = p.communicate()
    return (p.returncode, out, err)


def run_injector(args):
    injector_scenario_file_path, transactions_config_path, connection, batch_files_location, batch_file_to_process = args
    # -v SCENARIO_PATH=%1:CONFIGURATION_PATH=%2:CONNECTION=%3
    cmd_line = '{} {} {} {}'.format(os.path.join(batch_files_location, batch_file_to_process),
                                    injector_scenario_file_path.replace(':', '#'),
                                    transactions_config_path.replace(':', '#'),
                                    connection)
    print(" Calling :{}".format(cmd_line))
    p = subprocess.Popen(cmd_line, shell=True, stdin=subprocess.PIPE, stdout=subprocess.PIPE)
    out, err = p.communicate()
    return (p.returncode, out, err)


def main(argv=None):  # IGNORE:C0111
    '''Command line options.'''

    if argv is None:
        argv = sys.argv
    else:
        sys.argv.extend(argv)

    global logger
    start_time = datetime.utcnow()
    program_name = os.path.basename(sys.argv[0])
    program_version = "v%s" % __version__
    program_build_date = str(__updated__)
    program_version_message = '%%(prog)s %s (%s)' % (program_version, program_build_date)
    program_shortdesc = __import__('__main__').__doc__.split("\n")[1]
    program_license = '''%s

  Created by user_name on %s.
  Copyright 2016 organization_name. All rights reserved.

  Licensed under the Apache License 2.0
  http://www.apache.org/licenses/LICENSE-2.0

  Distributed on an "AS IS" basis without warranties
  or conditions of any kind, either express or implied.

USAGE
''' % (program_shortdesc, str(__date__))

    try:
        # Setup argument parser
        parser = ArgumentParser(description=program_license, formatter_class=RawDescriptionHelpFormatter)
        parser.add_argument("-v", "--verbose", dest="verbose", action="count",
                            help="set verbosity level [default: %(default)s]")
        parser.add_argument('-V', '--version', action='version', version=program_version_message)
        parser.add_argument("-o", "--output", dest="output", help="Output file. [default: %(default)s]",
                            metavar="VDDP.xls", default=aafpostresults.DEFAULT_VDDP_NAME)
        parser.add_argument("-l", "--error_list_file", dest="error_list_file",
                            help="Reference error list file. [default: %(default)s]", metavar="servererrorlist.txt",
                            default=aafpostresults.SERVERERRORLIST_FILE)
        parser.add_argument(dest="paths",
                            help="(1) path to folder(s) with data creation file(s),\n(2) DDP.xls file(input data description, configuration params)\n(3) PON.xls(instructions for PON Framework)",
                            metavar=["DIR", "DDP.xls", "PON.xls"], nargs=3)
        # Process arguments
        args = parser.parse_args()     ############## commented this line ##############
    ######################################
        #args = parser.parse_args([r"C:\TESTRESOURCES\PON",'TestEnv.xls','PONStart.xls'])   #################################### COMMAND ADDED #################################
    ######################################
        paths = args.paths
        verbose = args.verbose
        output_location = args.output
        error_list_file = args.error_list_file

        log_format = '%(asctime)s - %(name)s:%(funcName)s:%(lineno)d - [pid:%(process)d] - %(levelname)s - %(message)s'

        '''
        CRITICAL = 50     v
        ERROR = 40        vv
        WARNING = 30      vvv
        INFO = 20         vvvv
        DEBUG = 10        vvvvv
        NOTSET = 0
        '''
        log_level = logging.NOTSET
        if verbose:
            if 5 <= verbose:
                log_level = logging.DEBUG
                DEBUG = 1
            else:
                log_level = 50 - verbose * 10
        logging.basicConfig(level=log_level, format=log_format)
        logger = logging.getLogger('aafdatacreate')

        logger.setLevel(log_level)
        [log_handler.setLevel(log_level) for log_handler in logger.handlers]

        logger.debug("Input parameters :\n{}".format('\n'.join([f for f in paths])))

        data_creation_dir, ddp_file, pon_file = None, None, None
        if os.path.exists(paths[0]):
            data_creation_dir = paths[0]
        else:
            normalised_path = paths[0].replace("#", ":/").replace("/", os.path.sep)
            if os.path.exists(normalised_path):
                data_creation_dir = normalised_path

        if not data_creation_dir or not os.path.isdir(data_creation_dir):
            logger.error("Directory :{} is not accessible.".format(data_creation_dir))
            raise CLIError("Directory: {} is not accessible.".format(data_creation_dir))

        logger.debug("Data dir: {}".format(data_creation_dir))
        output_dir = os.path.join(data_creation_dir, 'etc')
        try:
            if os.path.exists(output_dir):
                logger.debug("Cleaning up output dir: {}".format(output_dir))
                shutil.rmtree(output_dir)
            os.makedirs(output_dir)
        except:
            logger.error("It was not possible to delete and/or recreate: {}".format(output_dir))
            raise CLIError("It was not possible to delete and/or recreate: {}".format(output_dir))

        ddp_file = os.path.join(data_creation_dir, paths[1])
        if not ddp_file or not os.path.isfile(ddp_file):
            logger.error("DDP file: {} is not accessible.".format(ddp_file))
            raise CLIError("DDP file: {} is not accessible.".format(ddp_file))
        pon_file = os.path.join(data_creation_dir, paths[2])
        if not pon_file or not os.path.isfile(pon_file):
            logger.error("PON file: {} is not accessible.".format(pon_file))
            raise CLIError("PON file: {} is not accessible.".format(pon_file))

        if not os.path.exists(os.path.join(data_creation_dir, 'etc', 'log')):
            os.makedirs(os.path.join(data_creation_dir, 'etc', 'log'))

        '''
        New XLS format:
        - from DDP we need to extract the CONNECTION per session/iteration
        - PON XLS file contains all the other data necessary for the pipeline to function
        '''
        ddp_data = parse_ddp_data(ddp_file)  #1
        pon_xls_data = parse_pon_xls_data(pon_file) #2

        '''
        Create the play files before going anywhere near TTS Session:
        '''
        transactions_config_path = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'cfg', 'tran.ini')
        connections_config_path = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'cfg', 'conn.ini')
        injector_scenarios, processing_blocks_per_session = generate_injector_scenarios_direct(ddp_data, pon_xls_data,
                                                                                               transactions_config_path,
                                                                                               os.path.join(
                                                                                                   os.path.dirname(
                                                                                                       ddp_file),
                                                                                                   'etc')) #3

        '''
        Build a map of the injector scenarios to iterations:
        '''
        batch_entries_location = os.path.join(os.path.dirname(__file__), "bin")

        get_session_name = lambda x: os.path.splitext(os.path.basename(x))[0]
        get_connection_from_scenario = lambda x: ddp_data.get(get_session_name(x))

        mprocess_args = [(injector_scenario_file_path, connections_config_path,
                          get_connection_from_scenario(injector_scenario_file_path),
                          batch_entries_location, INJECTOR_SCRIPT_NAME) for injector_scenario_file_path in
                         injector_scenarios]
        return_codes = []
        if MULTIPROCESSING:
            worker_pool_size = multiprocessing.cpu_count() - 1
            worker_pool_size = len(injector_scenarios) if len(
                injector_scenarios) < worker_pool_size else worker_pool_size
            pool = Pool(processes=worker_pool_size)
            res = pool.map_async(run_injector, mprocess_args)
            pool.close()
            pool.join()
            for res_val in res.get():
                return_codes.append(res_val[0])
                logger.debug("Return code: {}".format(str(res_val[0])))
                logger.debug("STD OUT:\n{}".format(res_val[1]))
                logger.debug("STD ERR:\n{}".format(res_val[2]))
        else:
            for process_args in mprocess_args:
                res_val = run_injector(process_args)
                return_codes.append(res_val[0])
                logger.debug("Return code: {}".format(str(res_val[0])))
                logger.debug("STD OUT:\n{}".format(res_val[1]))
                logger.debug("STD ERR:\n{}".format(res_val[2]))

        if 0 == sum(return_codes):
            result_data = process_result_data(injector_scenarios, processing_blocks_per_session) #4
            '''
            Generate rollback scenarios:
            '''
            logger.debug("Generating the roll back files for sessions: {}".format(', '.join(result_data.keys())))
            injector_scenarios, processing_blocks_per_session = generate_rollback_injector_scenarios_direct(
                processing_blocks_per_session, result_data, transactions_config_path, output_dir) #5

            '''
            Post processing:
            '''
            output_file = os.path.join(os.path.dirname(ddp_file), aafpostresults.DEFAULT_VDDP_NAME) #6
            logger.debug("Output file: {}".format(output_file))

            try:
                if os.path.exists(output_file):
                    logger.debug("Cleaning up output file: {}".format(output_file))
                    os.unlink(output_file)
            except:
                logger.error("It was not possible to delete: {}".format(output_file))
                raise

                # TODO: make sure it's not left in PRD
            #             with open('creation_data_result_%s.json' % (os.getpid()), 'w') as fl:
            #                 fl.write(json.dumps(result_data))

            aafpostresults.logger = logger
            aafpostresults.process_new_layout(result_data, output_file,
                                              reference_error_list_path=os.path.join(os.path.dirname(__file__),
                                                                                     aafpostresults.SERVERERRORLIST_FILE))
        else:
            completion_marker = aafpostresults.COMPLETION_MARKER_FAILED
            completion_marker_file_path = os.path.join(os.path.dirname(output_dir), completion_marker)
            completion_marker_successful_file_path = os.path.join(os.path.dirname(output_dir),
                                                                  aafpostresults.COMPLETION_MARKER_SUCCESS)

            if os.path.exists(completion_marker_successful_file_path):
                os.unlink(completion_marker_successful_file_path)
            open(completion_marker_file_path, 'w').close()
        passwordCleanup(output_dir +"/log")
        stop_time = datetime.utcnow()
        logger.debug("Processed in %d sec " % ((stop_time - start_time).total_seconds()))
        return 0
    except KeyboardInterrupt:
        ### handle keyboard interrupt ###
        return 0
    except:
        exc_type, exc_value, exc_traceback = sys.exc_info()
        traceback.print_tb(exc_traceback, 5)
        logger.error("%s: %s" % (exc_type, exc_value))
        return 2


if __name__ == "__main__":
    if DEBUG:
        sys.argv.append("-vvvvv")
    if TESTRUN:
        import doctest

        doctest.testmod()
    if PROFILE:
        import cProfile
        import pstats

        profile_filename = 'aafdatacreate.txt'
        cProfile.run('main()', profile_filename)
        statsfile = open("profile_stats.txt", "wb")
        p = pstats.Stats(profile_filename, stream=statsfile)
        stats = p.strip_dirs().sort_stats('cumulative')
        stats.print_stats()
        statsfile.close()
        sys.exit(0)
    sys.exit(main())
