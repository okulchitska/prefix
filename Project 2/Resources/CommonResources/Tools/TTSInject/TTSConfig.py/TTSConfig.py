
try:
    # Create the configuration
    config = Config()
    config.transportHeader = TH_TN3270
    config.host = "172.17.237.11"
    config.port = 16151
    config.timeout = 10.0
    config.tps = 10.0
    config.cps = 0.0
    config.sessionHeader = SH_TN3270
    config.conversationType = CT_Stateless
    config.ediCharSet = ECS_Raw
    config.releaseCharacter = "\\"
    config.maxSize = 409600
    config.compareMode = CM_AllWithoutDCX
    config.origin = "09CC0130"
    config.destin = ""
    config.useMultiLineRegularExpressions = 0
    config.keepContext = 0
    config.onTimeout = RTO_Continue
    config.initContextScript = ""
    config.encodeMessageFunction = ""
    config.decodeMessageFunction = ""
    config.decodeMode = DM_None

    drive = "/mnt/c/"
    if not (os.path.exists("/mnt/c/")):
        drive = "C:/"

    print("Running scenario in: " + drive + "TESTRESOURCES/DirectTTSInjector/TTSInjector.play")
    # Create and start the client
    clientScenario = Scenario(config, drive + "TESTRESOURCES/DirectTTSInjector/TTSInjector.play");
    clientScenarioLog = Log(config, drive + "TESTRESOURCES/DirectTTSInjector/DirectTTSInjector.play.log", LF_COMMENTS_ON,
                            LF_LOGLEVEL_MEDIUM, LF_LOGFORMAT_SIMPLE);
    clientScenarioRex = Log(config, drive + "TESTRESOURCES/DirectTTSInjector/DirectTTSInjector.play.rex", LF_COMMENTS_OFF,
                            LF_LOGLEVEL_MEDIUM, LF_LOGFORMAT_XML);
    client.start();
    client.wait();
    print(client.stats());

except Exception as e: 
    print(e)
    # Clean the objects
    try:
        del client;
    except NameError:
        print('Warning: client might has not been deleted')
    try:
        del clientScenario;
    except NameError:
        print('Warning: clientScenario might has not been deleted')
    try:
        del clientScenarioLog;
    except NameError:
        print('Warning: clientScenarioLog might has not been deleted')
    try:
        del clientScenarioRex;
    except NameError:
        print('Warning: clientScenarioRex might has not been deleted')
    try:
        del config;
    except NameError:
        print('Warning: config might has not been deleted')
    raise e
# Clean the objects
try:
    del client;
except NameError:
    print('Warning: client might has not been deleted')
try:
    del clientScenario;
except NameError:
    print('Warning: clientScenario might has not been deleted')
try:
    del clientScenarioLog;
except NameError:
    print('Warning: clientScenarioLog might has not been deleted')
try:
    del clientScenarioRex;
except NameError:
    print('Warning: clientScenarioRex might has not been deleted')
try:
    del config;
except NameError:
    print('Warning: config might has not been deleted')
