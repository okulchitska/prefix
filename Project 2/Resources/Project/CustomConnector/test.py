
def Hook_start( UserFields, Parameters, CurrentTestSet, CurrentTSTest, CurrentRun ):
    from pprint import pformat
    # Build a formated string of UserFields to output on Step Details
    StrUserFields = pformat( UserFields ,width=20)
    # Add a Step
    TDHelper.AddStepToRun("Hook Start",
         "My Customization",
         "No Error",
         "Hook Start has been called\n UserFields:\n" + StrUserFields,
         "Passed"
    )
    # Inject a parameter in connector as example
    Parameters["InjectedParameter"] = "Injecting Data to Connector from HookStart"
    
def Hook_stop( UserFields, Parameters, CurrentTestSet, CurrentTSTest, CurrentRun ):
    from pprint import pformat
    # Build a formated string of Parameters to output on Step Details
    StrParams = pformat( Parameters ,width=20)
    TDHelper.AddStepToRun("Hook Stop",
         "My Customization",
         "No Error",
         "Hook Stop has been called\n Parameters:\n" + StrParams,
         "Passed"
    )
