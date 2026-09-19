///
// File System Access API
///
// noinspection ExceptionCaughtLocallyJS

let lv3FileHandle = null;
let lv0RuntimeWordStressFileHandle = null;
let lv0RuntimeWordStressSettings = [];
let lv1SentencesFileHandle = null;

const DB_NAME = "IPA_Html_Settings";
const DB_VERSION = 1;
const STORE_NAME = "handles";
const FILE_HANDLE_KEY = "FILE_HANDLE_KEY_20260908";

const LV0_RUNTIME_WORD_STRESS_FILE_HANDLE_KEY =
  "LV0_RUNTIME_WORD_STRESS_FILE_HANDLE_KEY_20260910";

const TL_HIDE_STATE_KEY = "TL_HIDE_STATE_KEY_20260912";

function applyTlHideState() {
  const isHidden = localStorage.getItem(TL_HIDE_STATE_KEY) === "true";

  document.querySelectorAll(".box").forEach(function (box) {
    box.querySelectorAll(
      ":scope > *:not(.lv0):not(.lv1):not(.lv2)"
    ).forEach(function (child) {
      child.hidden = isHidden;
    });
  });
}

function applyEmbeddedLv0RuntimeWordStress() {
  document.querySelectorAll(
    ".word[data-id-in-jwordlist]"
  ).forEach(function (wordElement) {
    const isStressed =
      wordElement.dataset.runtimeWordStress === "true";

    wordElement.classList.toggle(
      "runtime-word-stress",
      isStressed
    );
  });
}

function getRuntimeWordStressSettingsFromPage() {
  const settings = [];

  document.querySelectorAll(
    '.word[data-id-in-jwordlist][data-runtime-word-stress="true"]'
  ).forEach(function (wordElement) {
    settings.push({
      "id_in_jWordList.json":
        Number(wordElement.dataset.idInJwordlist),
      "runtimeWordStress": true
    });
  });

  settings.sort(
    (a, b) =>
      Number(a["id_in_jWordList.json"]) -
      Number(b["id_in_jWordList.json"])
  );

  return settings;
}

async function loadLv0RuntimeWordStressFileHandle() {

  const db = await openHandleDatabase();

  return new Promise((resolve, reject) => {

    const transaction = db.transaction(
      STORE_NAME,
      "readonly"
    );

    const store = transaction.objectStore(
      STORE_NAME
    );

    const request = store.get(
      LV0_RUNTIME_WORD_STRESS_FILE_HANDLE_KEY
    );

    request.onsuccess = () => {
      resolve(request.result || null);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}


async function saveLv0RuntimeWordStressFileHandle(handle) {

  const db = await openHandleDatabase();

  return new Promise((resolve, reject) => {

    const transaction = db.transaction(
      STORE_NAME,
      "readwrite"
    );

    const store = transaction.objectStore(
      STORE_NAME
    );

    const request = store.put(
      handle,
      LV0_RUNTIME_WORD_STRESS_FILE_HANDLE_KEY
    );

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

async function restoreLv3FileHandle() {
  lv3FileHandle = await loadSavedFileHandle();
}

async function getLv0RuntimeWordStressFileHandle() {

  if (lv0RuntimeWordStressFileHandle) {
    return lv0RuntimeWordStressFileHandle;
  }

  const savedHandle =
    await loadLv0RuntimeWordStressFileHandle();

  if (savedHandle) {

    const permission =
      await savedHandle.queryPermission({
        mode: "readwrite"
      });

    if (permission === "granted") {
      lv0RuntimeWordStressFileHandle = savedHandle;
      return savedHandle;
    }

    const requestedPermission =
      await savedHandle.requestPermission({
        mode: "readwrite"
      });

    if (requestedPermission === "granted") {
      lv0RuntimeWordStressFileHandle = savedHandle;
      return savedHandle;
    }

    return null;
  }

  try {

    lv0RuntimeWordStressFileHandle =
      await window.showSaveFilePicker({
        suggestedName: "Lv0_runtimeWordStress.json",
        types: [
          {
            description: "JSON files",
            accept: {
              "application/json": [".json"]
            }
          }
        ]
      });

    await saveLv0RuntimeWordStressFileHandle(
      lv0RuntimeWordStressFileHandle
    );

    return lv0RuntimeWordStressFileHandle;

  } catch (error) {

    if (error.name === "AbortError") {
      return null;
    }

    throw error;
  }
}

///
// Open IndexedDB
///

function openHandleDatabase() {

  return new Promise(
    function (resolve, reject) {

      const request = indexedDB.open(
        DB_NAME,
        DB_VERSION
      );


      request.onupgradeneeded = function (event) {

        const db = event.target.result;

        if (
          !db.objectStoreNames.contains(
            STORE_NAME
          )
        ) {

          db.createObjectStore(
            STORE_NAME
          );

        }

      };


      request.onsuccess = function (event) {

        resolve(
          event.target.result
        );

      };


      request.onerror = function (event) {

        reject(
          event.target.error
        );

      };

    }
  );

}


///
// Load saved FileSystemFileHandle
///

async function loadSavedFileHandle() {

  const db = await openHandleDatabase();

  return new Promise(
    function (resolve, reject) {

      const transaction = db.transaction(
        STORE_NAME,
        "readonly"
      );

      const store =
        transaction.objectStore(
          STORE_NAME
        );

      const request = store.get(
        FILE_HANDLE_KEY
      );


      request.onsuccess = function () {

        resolve(
          request.result || null
        );

      };


      request.onerror = function (event) {

        reject(
          event.target.error
        );

      };

    }
  );

}


///
// Save FileSystemFileHandle to IndexedDB
///

async function saveFileHandle(handle) {

  const db = await openHandleDatabase();

  return new Promise(
    function (resolve, reject) {

      const transaction = db.transaction(
        STORE_NAME,
        "readwrite"
      );

      const store =
        transaction.objectStore(
          STORE_NAME
        );

      const request = store.put(
        handle,
        FILE_HANDLE_KEY
      );


      request.onsuccess = function () {

        resolve();

      };


      request.onerror = function (event) {

        reject(
          event.target.error
        );

      };

    }
  );

}

async function playLv1Sentence(text) {
  try {
    console.log("Playing sentence:", text);

    const audioPath = LV1_SENTENCES[text];

    console.log("Audio path:", audioPath);

    if (!audioPath) {
      console.log("No audio path found.");
      return;
    }

    const audio = new Audio(audioPath);

    await audio.play();

    console.log("Audio playing.");

  } catch (error) {
    console.error("Lv1 audio error:", error);
  }
}

///
// Load embedded Lv3 settings
///
function loadLv3Settings() {
  return LV3_SETTINGS;
}

///
// Apply saved Lv3 settings to the page
///

function applyLv3Settings(settings) {

  if (!settings) {

    return;

  }


  const boxes =
    document.querySelectorAll(".box");


  boxes.forEach(
    function (box) {

      const word =
        box.dataset.word;

      const savedIpa =
        settings[word];


      ///
      // No saved setting for this word.
      // Keep the generated default.
      ///

      if (
        savedIpa === undefined ||
        savedIpa === null
      ) {

        return;

      }


      const ipaItems =
        box.querySelectorAll(
          ".lv3 .ipa-item"
        );


      let matchingItem = null;


      ///
      // Find the saved IPA among the Lv3 choices.
      ///

      ipaItems.forEach(
        function (item) {

          if (
            item.dataset.ipa ===
            savedIpa
          ) {

            matchingItem = item;

          }

        }
      );


      ///
      // Saved IPA no longer exists in the current
      // ipaUniqueList.
      //
      // In that case keep the normal default.
      ///

      if (!matchingItem) {

        return;

      }


      ///
      // Remove current Lv3 selection.
      ///

      ipaItems.forEach(
        function (item) {

          item.classList.remove(
            "selected"
          );

        }
      );


      ///
      // Select saved Lv3 IPA.
      ///

      matchingItem.classList.add(
        "selected"
      );


      ///
      // Synchronize Lv2.
      ///

      const lv2 =
        box.querySelector(
          ".lv2"
        );


      if (lv2) {

        lv2.textContent =
          savedIpa;

      }

    }
  );

}

/// // Save current Lv3 selections
/*
. Existing IndexedDB handle → reuse it.
. Write permission available → save immediately.
. Permission needs approval → ask for permission.
. No usable handle → show the file picker.
. The JSON file is never read.
 */
async function saveLv3Settings() {
  let handle = lv3FileHandle;

  if (handle) {
    const permission = await handle.queryPermission({
      mode: "readwrite"
    });

    if (permission !== "granted") {
      const requested = await handle.requestPermission({
        mode: "readwrite"
      });

      if (requested !== "granted") {
        handle = null;
      }
    }
  }

  if (!handle) {
    handle = await window.showSaveFilePicker({
      suggestedName: "Lv3_settings_new.json",
      types: [
        {
          description: "JSON files",
          accept: {
            "application/json": [".json"]
          }
        }
      ]
    });

    lv3FileHandle = handle;
    await saveFileHandle(handle);
  }

  let settings = {};

  // ============================================================
  // Save only the FIRST occurrence of each word.
  //
  // Example:
  //
  //     The teacher, the one.
  //
  // If the first "the" is "ðə" and the second "the" is "ði",
  // only the first "the" is saved:
  //
  //     "the": "ðə"
  //
  // The second "the" is ignored.
  // ============================================================

  const processedWords = new Set();

  document.querySelectorAll(".box").forEach(function (box) {
    const word = box.dataset.word;

    // Ignore subsequent occurrences of the same word.
    if (processedWords.has(word)) {
      return;
    }

    // Mark this word as processed BEFORE saving it.
    processedWords.add(word);

    const selectedItem = box.querySelector(
      ".lv3 .ipa-item.selected"
    );

    if (selectedItem) {
      settings[word] = selectedItem.dataset.ipa;
    }
  });

  // Save the combined settings
  const json = JSON.stringify(settings, null, 4);

  const writable = await handle.createWritable();

  await writable.write(json);
  await writable.close();
}

async function loadLv0RuntimeWordStress() {
  applyEmbeddedLv0RuntimeWordStress();

  try {
    const fileHandle =
      await loadLv0RuntimeWordStressFileHandle();

    if (!fileHandle) {
      lv0RuntimeWordStressSettings =
        getRuntimeWordStressSettingsFromPage();
      return;
    }

    const permission =
      await fileHandle.queryPermission({mode: "read"});

    if (permission !== "granted") {
      lv0RuntimeWordStressSettings =
        getRuntimeWordStressSettingsFromPage();
      return;
    }

    const file = await fileHandle.getFile();
    const text = await file.text();

    const settings = JSON.parse(text);

    if (!Array.isArray(settings)) {
      throw new Error(
        "Lv0_runtimeWordStress.json must contain an array."
      );
    }

    lv0RuntimeWordStressSettings = settings;

    document.querySelectorAll(
      ".word[data-id-in-jwordlist]"
    ).forEach(function (wordElement) {
      wordElement.dataset.runtimeWordStress = "false";
      wordElement.classList.remove("runtime-word-stress");
    });

    settings.forEach(function (item) {
      if (item.runtimeWordStress !== true) {
        return;
      }

      const wordId =
        Number(item["id_in_jWordList.json"]);

      const wordElement = document.querySelector(
        `.word[data-id-in-jwordlist="${wordId}"]`
      );

      if (!wordElement) {
        return;
      }

      wordElement.dataset.runtimeWordStress = "true";
      wordElement.classList.add("runtime-word-stress");
    });

  } catch (error) {
    console.error(
      "Could not load Lv0 runtime word stress:",
      error
    );

    applyEmbeddedLv0RuntimeWordStress();

    lv0RuntimeWordStressSettings =
      getRuntimeWordStressSettingsFromPage();
  }
}

///
// DOMContentLoaded
///
document.addEventListener("DOMContentLoaded", async function () {

    applyTlHideState();

    await loadLv0RuntimeWordStress();

    document.querySelectorAll(".lv0").forEach(lv0 => {
      lv0.addEventListener("click", async () => {

        const wordId = Number(lv0.dataset.idInJwordlist);

        const wordElement = document.querySelector(
          `.word[data-id-in-jwordlist="${wordId}"]`
        );

        if (!wordElement) {
          return;
        }

        const isRuntimeWordStress =
          wordElement.dataset.runtimeWordStress === "true";

        wordElement.dataset.runtimeWordStress =
          isRuntimeWordStress ? "false" : "true";

        wordElement.classList.toggle(
          "runtime-word-stress",
          wordElement.dataset.runtimeWordStress === "true"
        );

        const settings =
          getRuntimeWordStressSettingsFromPage();

        const fileHandle =
          await getLv0RuntimeWordStressFileHandle();

        if (!fileHandle) {
          return;
        }

        const writable =
          await fileHandle.createWritable();

        await writable.write(
          JSON.stringify(settings, null, 4)
        );

        await writable.close();
      });
    });

    const lv1Sentences = {
      ...LV1_SENTENCES
    };

    async function saveLv1Sentences() {
      const json = JSON.stringify(lv1Sentences, null, 4);

      const writable = await lv1SentencesFileHandle.createWritable();
      await writable.write(json);
      await writable.close();
    }

    async function loadLv1Sentences() {
      if (!lv1SentencesFileHandle) {
        return;
      }

      const file = await lv1SentencesFileHandle.getFile();
      const text = await file.text();

      if (!text.trim()) {
        return;
      }

      const existing = JSON.parse(text);

      Object.assign(lv1Sentences, existing);
    }

    function MY_HASH_1(text) {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      let hash = 2166136261;

      for (let i = 0; i < text.length; i++) {
        hash ^= text.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
      }

      let result = "";

      for (let i = 0; i < 4; i++) {
        result += chars[hash >>> 0 & 31];
        hash = Math.imul(hash ^ (hash >>> 13), 16777619);
      }

      return result;
    }

    function getSentenceFromPunctuation(punctuation) {
      const words = [];
      const currentBox = punctuation.closest(".box");

      let box = currentBox.nextElementSibling;

      while (box) {
        if (!box.classList.contains("box")) {
          box = box.nextElementSibling;
          continue;
        }

        const phraseEnding = box.querySelector(
          ".phrase-ending-punctuation"
        );

        if (phraseEnding) {
          break;
        }

        words.push(box.dataset.word);
        box = box.nextElementSibling;
      }

      return words.join(" ")
        .replace(/\s+([.!?:;,])/g, "$1");
    }

    const phraseEndingPunctuation =
      document.querySelectorAll(".lv2.phrase-ending-punctuation");

    phraseEndingPunctuation.forEach(function (punctuation) {
      punctuation.addEventListener("click", async function () {
        const X = getSentenceFromPunctuation(this);
        await navigator.clipboard.writeText(X);
        console.log("Copied:", X);
      });
    });

    const phraseEndingPunctuationLv3 = document.querySelectorAll(".lv3.phrase-ending-punctuation");

    phraseEndingPunctuationLv3.forEach(function (punctuation) {
        punctuation.addEventListener("click", async function () {
            const text = getSentenceFromPunctuation(this);

            if (!lv1SentencesFileHandle) {
                lv1SentencesFileHandle = await window.showSaveFilePicker({
                    suggestedName: "Lv1_sentences_new.json",
                    types: [
                        {
                            description: "JSON files",
                            accept: {"application/json": [".json"]}
                        }
                    ]
                });
            }

            await loadLv1Sentences();

            const filePicker = await window.showOpenFilePicker({
                multiple: false,
                types: [
                    {
                        description: "Audio files",
                        accept: {"audio/*": [".mp3", ".wav"]}
                    }
                ]
            });

            const fileHandle = filePicker[0];
            const file = await fileHandle.getFile();

            const hash = MY_HASH_1(text);
            const extension = file.name.substring(file.name.lastIndexOf("."));
            const newFileName = hash + extension;

            await fileHandle.move(newFileName);

            lv1Sentences[text] = "../../7___html_settings/saved_phrase_mp3/" + newFileName;

            await saveLv1Sentences();

            console.log("Lv1 sentence mapping:", lv1Sentences);
            console.log("Sentence:", text);
            console.log("Audio file renamed to:", newFileName);
            console.log("Sentence:", text);
            console.log("Lv1 sentence mapping:", lv1Sentences);
        });
    });

    ///
    const phraseEndingPunctuationLv1 = document.querySelectorAll(
      ".box .word.lv1.phrase-ending-punctuation"
    );

    phraseEndingPunctuationLv1.forEach(function (punctuation) {
      punctuation.addEventListener("click", async function () {

        console.log("=== Lv1 punctuation clicked ===");
        console.log("Clicked element:", this);
        console.log("Clicked text:", this.textContent);
        console.log("Closest .box:", this.closest(".box"));

        console.log("Before getSentenceFromPunctuation()");
        const text = getSentenceFromPunctuation(this);
        console.log("After getSentenceFromPunctuation()");
        console.log("Returned sentence:", JSON.stringify(text));

        console.log("Sentence returned by getSentenceFromPunctuation():", text);

        await playLv1Sentence(text);

        console.log("playLv1Sentence() completed.");
      });
    });
    ///

    const wordLv1 = document.querySelectorAll(
      ".box .word.lv1:not(.phrase-ending-punctuation)"
    );

    wordLv1.forEach(function (word) {
      word.addEventListener("click", function () {
        const box = this.closest(".box");

        const forvoItem = Array.from(
          box.querySelectorAll(".forvo-item")
        ).find(function (item) {
          const filename = (item.dataset.audioSrc || "").split("/").pop();

          return /__1__i\(.*\)__h\(.*\)\.mp3$/.test(filename);
        });

        if (!forvoItem) {
          return;
        }

        forvoItem.click();
      });
    });

    ///
    // TL_SaveButton
    ///

    const TL_SaveButton =
      document.getElementById(
        "TL_SaveButton"
      );


    TL_SaveButton.addEventListener(
      "click",
      async function () {

        try {

          await saveLv3Settings();

          console.log(
            "Lv3_settings_new.json saved."
          );

        } catch (error) {

          console.error(
            "Could not save Lv3_settings_new.json:",
            error
          );

        }

      }
    );

    /// /// // TL_HideButton ///
    const TL_HideButton = document.getElementById("TL_HideButton");

    TL_HideButton.addEventListener("click", function () {
      const isHidden = localStorage.getItem(TL_HIDE_STATE_KEY) === "true";

      localStorage.setItem(
        TL_HIDE_STATE_KEY,
        String(!isHidden)
      );

      applyTlHideState();
    });

    ///
    // Lv3 IPA choices
    ///

    const ipaItems =
      document.querySelectorAll(
        ".lv3 .ipa-item"
      );


    ipaItems.forEach(
      function (item) {

        item.addEventListener(
          "click",
          function () {

            const box =
              this.closest(
                ".box"
              );


            const lv2 =
              box.querySelector(
                ".lv2"
              );


            ///
            // Remove selection from all Lv3 choices
            // in this Lv1 box.
            ///

            box.querySelectorAll(
              ".lv3 .ipa-item"
            ).forEach(
              function (item) {

                item.classList.remove(
                  "selected"
                );

              }
            );


            ///
            // Select clicked Lv3 choice.
            ///

            this.classList.add(
              "selected"
            );


            ///
            // Update Lv2.
            ///

            lv2.textContent =
              this.dataset.ipa;

          }
        );

      }
    );

    /// Lv5 > button: select corresponding Lv3 IPA ///
    const lv5Buttons = document.querySelectorAll(".lv5-button");

    lv5Buttons.forEach(function (button) {
      button.addEventListener("click", function (event) {
        // Prevent the click from reaching .mp3-item,
        // so the MP3 does not play.
        event.stopPropagation();

        const lv5Item = this.closest(".mp3-item");
        const box = this.closest(".box");

        const ipa = lv5Item.querySelector(".lv5-ipa").textContent.trim();

        const matchingLv3Item = Array.from(
          box.querySelectorAll(".lv3 .ipa-item")
        ).find(function (item) {
          return item.dataset.ipa === ipa;
        });

        if (!matchingLv3Item) {
          return;
        }

        box.querySelectorAll(".lv3 .ipa-item").forEach(function (item) {
          item.classList.remove("selected");
        });

        matchingLv3Item.classList.add("selected");

        const lv2 = box.querySelector(".lv2");
        lv2.textContent = ipa;
      });
    });

    /// Lv4 Forvo audio ///
    const forvoItems = document.querySelectorAll(".forvo-item");

    forvoItems.forEach(function (item) {

      item.addEventListener("click", function () {

        const audioSrc = this.dataset.audioSrc;

        const audio = new Audio(audioSrc);

        audio.play();

      });

    });


    /// // Lv5 non-Forvo audio ///
    const mp3Items = document.querySelectorAll(".mp3-item");

    mp3Items.forEach(function (item) {

      item.addEventListener("click", function () {

        const audioSrc = this.dataset.audioSrc;

        const audio = new Audio(audioSrc);

        audio.play();

      });

    });

    ///
    // Restore saved Lv3 file handle and apply embedded settings
    ///

    try {

      await restoreLv3FileHandle();
      const savedSettings = loadLv3Settings();

      applyLv3Settings(
        savedSettings
      );

    } catch (error) {

      console.error(
        "Could not load Lv3 settings:",
        error
      );

    }

  }
);
