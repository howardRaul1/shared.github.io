from pathlib import Path
from playwright.sync_api import Error as PlaywrightError
import pytest
import z1___currentSrc.p008___English_IPA_Html_creator.flow.IPA_Json_Generator as IPA_Json_Generator
from web_driver import EdgeBrowser
from z1___currentSrc.p008___English_IPA_Html_creator.a___G import C008
from z1___currentSrc.p008___English_IPA_Html_creator.a___G import G008
from z1___currentSrc.p008___English_IPA_Html_creator.flow import IpaHtmlPage_Builder, SettingsMerger

def test_fn():
  root = Path(__file__).parent.resolve()
  G008.initFilePaths(str(root))
  print('\n***** BEGIN *************')

  generate_json = True
  generate_html = True

  try:

    C008.lv3_settings, C008.lv1_sentences = SettingsMerger.merge()

    if generate_json:
      EdgeBrowser.startRemoteConnect(G008.G008_TIMEOUT)  # a___topG.G.GLOBAL_TIMEOUT = 12000
      EdgeBrowser.getPage().goto("about:blank")
      IPA_Json_Generator.run()

    if generate_html:   IpaHtmlPage_Builder.run()

  except PlaywrightError as e:
    if "ECONNREFUSED" in str(e): pytest.fail(f"{G008.ERR_STR}Chrome_Beta was not launched.  Please run:\n\n" + r"C:\Users\peterCasualWin10a\Documents\1c___GitHub_repos\2026_Python\a1\test\t005___VisitTutorProfiles\Launch_Chrome_Beta_in_dbg_mode.bat", pytrace=False)
    pytest.fail(f"{G008.ERR_STR}We encountered other PlayWright errors. ", pytrace=False)
  finally:
    EdgeBrowser.close()

  print('***** END *************')

"""
===== AI Prompts: =====
walk me thru this step by step.  no commentary - just show me what exactly to change.  your first response should show step 1 only (absolutely no step 2! and absolutely no commentary!  anything that does not directly describes a code change is a commentary.) Also, do not keep asking me to change the same function - take a few more seconds to think to consolidate your changes. When all code-change steps are done, show the testing steps. When I type "a", I  mean "acknowledged and done.  Please show the next step".


------------------------------------------------------------------------------------------------------------------------
. sentence save/load (dialog works in Chrome only; Firefox has no File System Access API)

      . add a button at the beginning of each sentence to pick mp3_path
      
        . save mp3_path into Lv1_sentences_new.json (one-way save, no read-back, just like Lv3_settings)
        
        . when generating html, merge Lv1_sentences_new.json into Lv1_sentences.json (creating Lv1_sentences if file doesn't already exist). 
          . delete Lv1_sentences_new.json after reading
        
        . read mp3_filepath from Lv1_sentences.json, store this info in an embedded variable in index.html (just like Lv3_settings.json), so that a refreshly-generated index.html will have Lv1 .phrase-ending-punctuation boxes that each play the appro
    
. Clicking a lv0 div should set the "runtimeWordStress" status (this is different from "wordStress") of the associated .word as True. (the .word is uniquely identified by its id in jWordList.json)

      When clicking on a lv0 div for the first time, a file picker should pop up and ask the user for the filepath to save ALL lv0 settings to (default: "7___html_settings/Lv0_runtimeWordStress.json").  This file has format:
      
      [
        { "id_in_jWordList.json": 2  , "runtimeWordStress": true }
        { "id_in_jWordList.json": 123, "runtimeWordStress": true }
      ]
      
      (.word without an entry in Lv0_runtimeWordStress.json are assumed to have "runtimeWordStress" = false)
      
      When clicking on a lv0 div a second time, no file picker should pop up.  Instead, the updated lv0 settings (for all lv0 div's) are saved to the previously-set file handle.
      
      Refreshing the page should keep the same stressed word highlighted (by reading from "7___html_settings/Lv0_runtimeWordStress.json").
          
"""





