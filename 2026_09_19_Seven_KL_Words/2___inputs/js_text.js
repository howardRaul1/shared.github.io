///
// File System Access API
///
// noinspection ExceptionCaughtLocallyJS

const BOOKMARK_DIV_PERCENTAGE_H_FROM_TOP = 0.20;

let lv3FileHandle = null;
let lv0RuntimeWordStressSettings = [];

let sharedDirectoryHandle = null;
let lv1SentencesFileHandle = null;
let lv1MySentencesFileHandle = null;

const DB_NAME = "IPA_Html_Settings";
const DB_VERSION = 1;
const STORE_NAME = "handles";

const TL_HIDE_STATE_KEY = "TL_HIDE_STATE_KEY_20260912";
const BOOKMARKED_SETTINGS_KEY = "BOOKMARKED_SETTINGS_KEY_20260915";
const SHARED_DIRECTORY_HANDLE_KEY =
  "SHARED_DIRECTORY_HANDLE_KEY_20260918";

function applyTlHideState() {
  const isHidden =
    localStorage.getItem(TL_HIDE_STATE_KEY) === "true";

  document.querySelectorAll(".box").forEach(function (box) {
    box.querySelectorAll(
      ":scope > *:not(.lv0):not(.lv1):not(.lv2):not(.lvB1)"
    ).forEach(function (child) {
      child.hidden = isHidden;
    });
  });
}

function applyBookmarkedSettings() {
  const settings = JSON.parse(
    localStorage.getItem(BOOKMARKED_SETTINGS_KEY) || "[]"
  );

  document.querySelectorAll(".lvB1").forEach(function (lvB1) {
    const wordId =
      lvB1.previousElementSibling?.dataset.idInJwordlist;

    const isBookmarked =
      settings.includes(Number(wordId));

    lvB1.classList.toggle(
      "bookmarked",
      isBookmarked
    );
  });
}

function saveBookmarkedSettings() {
  const settings = [];

  document.querySelectorAll(
    ".lvB1.bookmarked"
  ).forEach(function (lvB1) {

    const wordId =
      lvB1.previousElementSibling?.dataset.idInJwordlist;

    if (wordId !== undefined) {
      settings.push(Number(wordId));
    }
  });

  localStorage.setItem(
    BOOKMARKED_SETTINGS_KEY,
    JSON.stringify(settings)
  );
}

function scrollToLastBookmarked() {
  const bookmarked =
    document.querySelectorAll(".lvB1.bookmarked");

  if (bookmarked.length === 0) {
    return;
  }

  const lastBookmarked =
    bookmarked[bookmarked.length - 1];

  const rect =
    lastBookmarked.getBoundingClientRect();

  const targetY =
    window.scrollY +
    rect.top -
    (window.innerHeight *
      BOOKMARK_DIV_PERCENTAGE_H_FROM_TOP);

  window.scrollTo({
    top: Math.max(0, targetY),
    behavior: "auto"
  });
}

function scrollToLastBookmarkedAfterRefresh() {
  setTimeout(function () {
    scrollToLastBookmarked();
  }, 100);
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
        Number(
          wordElement.dataset.idInJwordlist
        ),
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

///
// Open IndexedDB
///

function openHandleDatabase() {
  return new Promise(function (resolve, reject) {

    const request =
      indexedDB.open(
        DB_NAME,
        DB_VERSION
      );

    request.onupgradeneeded =
      function (event) {

        const db =
          event.target.result;

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

    request.onsuccess =
      function (event) {

        resolve(
          event.target.result
        );
      };

    request.onerror =
      function (event) {

        reject(
          event.target.error
        );
      };
  });
}

///
// Shared FileSystemDirectoryHandle in IndexedDB
///

async function loadSharedDirectoryHandle() {
  const db =
    await openHandleDatabase();

  return new Promise(function (resolve, reject) {

    const transaction =
      db.transaction(
        STORE_NAME,
        "readonly"
      );

    const store =
      transaction.objectStore(
        STORE_NAME
      );

    const request =
      store.get(
        SHARED_DIRECTORY_HANDLE_KEY
      );

    request.onsuccess =
      function () {

        resolve(
          request.result || null
        );
      };

    request.onerror =
      function (event) {

        reject(
          event.target.error
        );
      };
  });
}

async function saveSharedDirectoryHandle(handle) {
  const db =
    await openHandleDatabase();

  return new Promise(function (resolve, reject) {

    const transaction =
      db.transaction(
        STORE_NAME,
        "readwrite"
      );

    const store =
      transaction.objectStore(
        STORE_NAME
      );

    const request =
      store.put(
        handle,
        SHARED_DIRECTORY_HANDLE_KEY
      );

    request.onsuccess =
      function () {

        resolve();
      };

    request.onerror =
      function (event) {

        reject(
          event.target.error
        );
      };
  });
}

///
// Get shared directory.
//
// Existing usable handle:
//     reuse it.
//
// Existing saved handle:
//     reuse it.
//
// Permission needed:
//     request permission during the user action.
//
// No usable handle:
//     show directory picker during the user action.
//
async function getOrChooseSharedDirectoryHandle() {

  if (sharedDirectoryHandle) {

    const permission =
      await sharedDirectoryHandle.queryPermission({
        mode: "readwrite"
      });

    if (permission === "granted") {
      return sharedDirectoryHandle;
    }

    const requestedPermission =
      await sharedDirectoryHandle.requestPermission({
        mode: "readwrite"
      });

    if (requestedPermission === "granted") {
      return sharedDirectoryHandle;
    }

    sharedDirectoryHandle = null;
  }

  const savedHandle =
    await loadSharedDirectoryHandle();

  if (savedHandle) {

    const permission =
      await savedHandle.queryPermission({
        mode: "readwrite"
      });

    if (permission === "granted") {

      sharedDirectoryHandle =
        savedHandle;

      return savedHandle;
    }

    const requestedPermission =
      await savedHandle.requestPermission({
        mode: "readwrite"
      });

    if (requestedPermission === "granted") {

      sharedDirectoryHandle =
        savedHandle;

      return savedHandle;
    }
  }

  try {

    const directoryHandle =
      await window.showDirectoryPicker({
        mode: "readwrite"
      });

    sharedDirectoryHandle =
      directoryHandle;

    await saveSharedDirectoryHandle(
      directoryHandle
    );

    return directoryHandle;

  } catch (error) {

    if (error.name === "AbortError") {
      return null;
    }

    throw error;
  }
}

///
// Get an Lv1 file from the shared directory.
//
async function getLv1FileHandle(fileName) {

  const directoryHandle =
    await getOrChooseSharedDirectoryHandle();

  if (!directoryHandle) {
    return null;
  }

  return await directoryHandle.getFileHandle(
    fileName,
    {
      create: true
    }
  );
}

///
// Get existing Lv0 runtime-word-stress file.
//
// IMPORTANT:
// This function is used during page loading.
// It NEVER creates the file and NEVER opens
// the directory picker.
//
// The file is created only by the .lv0 click handler.
//
async function loadLv0RuntimeWordStressFileHandle() {

  const directoryHandle =
    await loadSharedDirectoryHandle();

  if (directoryHandle) {

    sharedDirectoryHandle =
      directoryHandle;
  }

  if (!directoryHandle) {
    return null;
  }

  const permission =
      await directoryHandle.queryPermission({
          mode: "read"
      });

  if (permission !== "granted") {
    return null;
  }

  try {

    return await directoryHandle.getFileHandle(
      "Lv0_runtimeWordStress.json",
      {
        create: false
      }
    );

  } catch (error) {

    if (error.name === "NotFoundError") {
      return null;
    }

    throw error;
  }
}

///
// Restore Lv3 file handle from the
// already-saved shared directory.
//
// This function never opens the directory picker.
// It never creates Lv3_settings_new.json.
//
async function restoreLv3FileHandle() {

  const directoryHandle =
    await loadSharedDirectoryHandle();

  if (directoryHandle) {

    sharedDirectoryHandle =
      directoryHandle;
  }

  if (!directoryHandle) {

    lv3FileHandle = null;

    return;
  }

  const permission =
      await directoryHandle.queryPermission({
          mode: "read"
      });

  if (permission !== "granted") {

    lv3FileHandle = null;

    return;
  }

  try {

    lv3FileHandle =
      await directoryHandle.getFileHandle(
        "Lv3_settings_new.json",
        {
          create: false
        }
      );

  } catch (error) {

    if (error.name === "NotFoundError") {

      lv3FileHandle = null;

      return;
    }

    throw error;
  }
}

async function playLv1Sentence(text) {

  try {

    console.log(
      "Playing sentence:",
      text
    );

    const audioPath =
      LV1_SENTENCES[text];

    console.log(
      "Audio path:",
      audioPath
    );

    if (!audioPath) {

      console.log(
        "No audio path found."
      );

      return;
    }

    const audio =
      new Audio(audioPath);

    await audio.play();

    console.log(
      "Audio playing."
    );

  } catch (error) {

    console.error(
      "Lv1 audio error:",
      error
    );
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

  boxes.forEach(function (box) {

    const word =
      box.dataset.word;

    const savedIpa =
      settings[word];

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

    ipaItems.forEach(function (item) {

      if (
        item.dataset.ipa ===
        savedIpa
      ) {
        matchingItem = item;
      }
    });

    if (!matchingItem) {
      return;
    }

    ipaItems.forEach(function (item) {

      item.classList.remove(
        "selected"
      );
    });

    matchingItem.classList.add(
      "selected"
    );

    const lv2 =
      box.querySelector(
        ".lv2"
      );

    if (lv2) {

      lv2.textContent =
        savedIpa;
    }
  });
}

///
// Save current Lv3 selections
//
// This function is called only from the
// TL_SaveButton user action.
//
// If no shared directory exists yet,
// the directory picker may appear here.
//
async function saveLv3Settings() {

  const directoryHandle =
    await getOrChooseSharedDirectoryHandle();

  if (!directoryHandle) {
    return false;
  }

  const handle =
    await directoryHandle.getFileHandle(
      "Lv3_settings_new.json",
      {
        create: true
      }
    );

  lv3FileHandle =
    handle;

  const settings = {};

  const processedWords =
    new Set();

  document.querySelectorAll(
    ".box"
  ).forEach(function (box) {

    const word =
      box.dataset.word;

    if (
      processedWords.has(word)
    ) {
      return;
    }

    processedWords.add(
      word
    );

    const selectedItem =
      box.querySelector(
        ".lv3 .ipa-item.selected"
      );

    if (selectedItem) {

      settings[word] =
        selectedItem.dataset.ipa;
    }
  });

  const json =
    JSON.stringify(
      settings,
      null,
      4
    );

  const writable =
    await handle.createWritable();

  await writable.write(
    json
  );

  await writable.close();

  return true;
}

async function loadLv0RuntimeWordStress() {

  const fileHandle =
    await loadLv0RuntimeWordStressFileHandle();

  if (!fileHandle) {

    lv0RuntimeWordStressSettings =
      getRuntimeWordStressSettingsFromPage();

    return;
  }

  const file =
    await fileHandle.getFile();

  const text =
    await file.text();

  if (!text.trim()) {

    lv0RuntimeWordStressSettings =
      getRuntimeWordStressSettingsFromPage();

    return;
  }

  try {

    lv0RuntimeWordStressSettings =
      JSON.parse(text);

  } catch (error) {

    console.error(
      "Failed to parse Lv0 runtime word-stress settings:",
      error
    );

    lv0RuntimeWordStressSettings =
      getRuntimeWordStressSettingsFromPage();
  }
}

///
// DOMContentLoaded
///

document.addEventListener(
  "DOMContentLoaded",
  async function () {

    applyTlHideState();

    applyBookmarkedSettings();

    scrollToLastBookmarkedAfterRefresh();

    document.querySelectorAll(
      ".lvB1"
    ).forEach(function (lvB1) {

      lvB1.addEventListener(
        "click",
        function () {

          this.classList.toggle(
            "bookmarked"
          );

          this.style.removeProperty(
            "background"
          );

          saveBookmarkedSettings();
        }
      );
    });

    await loadLv0RuntimeWordStress();

    ///
    // Lv0 runtime word stress
    ///

    document.querySelectorAll(
      ".lv0"
    ).forEach(function (lv0) {

      lv0.addEventListener(
        "click",
        async function () {

          const wordId =
            Number(
              lv0.dataset.idInJwordlist
            );

          const wordElement =
            document.querySelector(
              `.word[data-id-in-jwordlist="${wordId}"]`
            );

          if (!wordElement) {
            return;
          }

          const previousValue =
            wordElement.dataset.runtimeWordStress;

          const isRuntimeWordStress =
            previousValue === "true";

          wordElement.dataset.runtimeWordStress =
            isRuntimeWordStress
              ? "false"
              : "true";

          wordElement.classList.toggle(
            "runtime-word-stress",
            wordElement.dataset.runtimeWordStress ===
              "true"
          );

          const settings =
            getRuntimeWordStressSettingsFromPage();

          try {

            ///
            // This is a USER CLICK.
            //
            // Therefore this is allowed to:
            //   1. reuse the shared handle
            //   2. request permission
            //   3. open showDirectoryPicker()
            ///

            const directoryHandle =
              await getOrChooseSharedDirectoryHandle();

            if (!directoryHandle) {

              wordElement.dataset.runtimeWordStress =
                previousValue;

              wordElement.classList.toggle(
                "runtime-word-stress",
                previousValue === "true"
              );

              return;
            }

            const fileHandle =
              await directoryHandle.getFileHandle(
                "Lv0_runtimeWordStress.json",
                {
                  create: true
                }
              );

            const writable =
              await fileHandle.createWritable();

            await writable.write(
              JSON.stringify(
                settings,
                null,
                4
              )
            );

            await writable.close();

          } catch (error) {

            wordElement.dataset.runtimeWordStress =
              previousValue;

            wordElement.classList.toggle(
              "runtime-word-stress",
              previousValue === "true"
            );

            console.error(
              "Could not save Lv0 runtime word-stress settings:",
              error
            );
          }
        }
      );
    });

    ///
    // Lv1 sentence settings
    ///

    const lv1Sentences = {
      ...LV1_SENTENCES
    };

    const lv1MySentences = {
      ...LV1_MY_SENTENCES
    };

    async function saveLv1Sentences() {

      const json =
        JSON.stringify(
          lv1Sentences,
          null,
          4
        );

      const writable =
        await lv1SentencesFileHandle.createWritable();

      await writable.write(
        json
      );

      await writable.close();
    }

    async function loadLv1Sentences() {

      if (!lv1SentencesFileHandle) {
        return;
      }

      const file =
        await lv1SentencesFileHandle.getFile();

      const text =
        await file.text();

      if (!text.trim()) {
        return;
      }

      const existing =
        JSON.parse(text);

      Object.assign(
        lv1Sentences,
        existing
      );
    }

    async function saveLv1MySentences() {

      const json =
        JSON.stringify(
          lv1MySentences,
          null,
          4
        );

      const writable =
        await lv1MySentencesFileHandle.createWritable();

      await writable.write(
        json
      );

      await writable.close();
    }

    async function loadLv1MySentences() {

      if (!lv1MySentencesFileHandle) {
        return;
      }

      const file =
        await lv1MySentencesFileHandle.getFile();

      const text =
        await file.text();

      if (!text.trim()) {
        return;
      }

      const existing =
        JSON.parse(text);

      Object.assign(
        lv1MySentences,
        existing
      );
    }

    function MY_HASH_1(text) {

      const chars =
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

      let hash =
        2166136261;

      for (
        let i = 0;
        i < text.length;
        i++
      ) {

        hash ^=
          text.charCodeAt(i);

        hash =
          Math.imul(
            hash,
            16777619
          );
      }

      let result = "";

      for (
        let i = 0;
        i < 4;
        i++
      ) {

        result +=
          chars[
            hash >>> 0 & 31
          ];

        hash =
          Math.imul(
            hash ^ (hash >>> 13),
            16777619
          );
      }

      return result;
    }

    function getSentenceFromPunctuation(
      punctuation
    ) {

      const words = [];

      const currentBox =
        punctuation.closest(
          ".box"
        );

      let box =
        currentBox.nextElementSibling;

      while (box) {

        if (
          !box.classList.contains(
            "box"
          )
        ) {

          box =
            box.nextElementSibling;

          continue;
        }

        const phraseEnding =
          box.querySelector(
            ".phrase-ending-punctuation"
          );

        if (phraseEnding) {
          break;
        }

        words.push(
          box.dataset.word
        );

        box =
          box.nextElementSibling;
      }

      return words
        .join(" ")
        .replace(
          /\s+([.!?:;,])/g,
          "$1"
        );
    }

    ///
    // Lv2 punctuation = copy sentence
    ///

    const phraseEndingPunctuation =
      document.querySelectorAll(
        ".lv2.phrase-ending-punctuation"
      );

    phraseEndingPunctuation.forEach(
      function (punctuation) {

        punctuation.addEventListener(
          "click",
          async function () {

            const X =
              getSentenceFromPunctuation(
                this
              );

            await navigator.clipboard.writeText(
              X
            );

            console.log(
              "Copied:",
              X
            );
          }
        );
      }
    );

    ///
    // Lv3 / Lv5 save-and-flash
    ///

    const phraseEndingPunctuationLv3 =
      document.querySelectorAll(
        ".lv3.phrase-ending-punctuation"
      );

    const phraseEndingPunctuationLv5 =
      document.querySelectorAll(
        ".lv5.phrase-ending-punctuation"
      );

    async function flashAfterSuccessfulSave( element, saveFunction ) {
        const result = await saveFunction();
        if (result === false) {
            return false;
        }
        element.classList.remove( "flash-slowly-once" );
        void element.offsetWidth;
        element.classList.add( "flash-slowly-once" );
        return true;
    }

    ///
    // Lv3 punctuation
    //
    // Saves:
    //     Lv1_mp3_new.json
    //
    // Uses shared directory.
    //
    // Flashes only after successful save.
    ///

    phraseEndingPunctuationLv3.forEach(
      function (punctuation) {

        punctuation.addEventListener(
          "click",
          async function () {

            try {

              const text =
                getSentenceFromPunctuation(
                  this
                );

              lv1SentencesFileHandle =
                await getLv1FileHandle(
                  "Lv1_mp3_new.json"
                );

              if (!lv1SentencesFileHandle) {
                return;
              }

              await loadLv1Sentences();

              const hash =
                MY_HASH_1(
                  text
                );

              const fileName =
                hash + ".mp3";

              lv1Sentences[text] =
                "../../7___html_settings/saved_phrase_mp3/" +
                fileName;

              await flashAfterSuccessfulSave(
                this,
                saveLv1Sentences
              );

              console.log(
                "Lv1 sentence mapping:",
                lv1Sentences
              );

              console.log(
                "Sentence:",
                text
              );

              console.log(
                "Audio path:",
                lv1Sentences[text]
              );

            } catch (error) {

              console.error(
                "Could not save Lv1_mp3_new.json:",
                error
              );
            }
          }
        );
      }
    );

    ///
    // Lv5 punctuation
    //
    // Saves:
    //     Lv1_my_mp3_new.json
    //
    // Uses shared directory.
    //
    // Flashes only after successful save.
    ///

    phraseEndingPunctuationLv5.forEach(
      function (punctuation) {

        punctuation.addEventListener(
          "click",
          async function () {

            try {

              const text =
                getSentenceFromPunctuation(
                  this
                );

              lv1MySentencesFileHandle =
                await getLv1FileHandle(
                  "Lv1_my_mp3_new.json"
                );

              if (!lv1MySentencesFileHandle) {
                return;
              }

              await loadLv1MySentences();

              const hash =
                MY_HASH_1(
                  text
                );

              const fileName =
                hash + ".mp3";

              lv1MySentences[text] =
                "../../7___html_settings/saved_phrase_my_mp3/" +
                fileName;

              await flashAfterSuccessfulSave(
                this,
                saveLv1MySentences
              );

              console.log(
                "Saved Lv1 my sentence:",
                text
              );

            } catch (error) {

              console.error(
                "Could not save Lv1_my_mp3_new.json:",
                error
              );
            }
          }
        );
      }
    );

    ///
    // Lv4 = play Lv1.my sentence
    ///

    async function playLv1MySentence(text) {

      try {

        console.log(
          "Playing my sentence:",
          text
        );

        const audioPath =
          lv1MySentences[text];

        console.log(
          "My audio path:",
          audioPath
        );

        if (!audioPath) {

          console.log(
            "No my audio path found."
          );

          return;
        }

        const audio =
          new Audio(
            audioPath
          );

        await audio.play();

        console.log(
          "My audio playing."
        );

      } catch (error) {

        console.error(
          "Lv4 audio error:",
          error
        );
      }
    }

    const phraseEndingPunctuationLv4 =
      document.querySelectorAll(
        ".lv4.phrase-ending-punctuation"
      );

    phraseEndingPunctuationLv4.forEach(
      function (punctuation) {

        punctuation.addEventListener(
          "click",
          async function () {

            const text =
              getSentenceFromPunctuation(
                this
              );

            await playLv1MySentence(
              text
            );
          }
        );
      }
    );

    ///
    // Lv1 punctuation = play Lv1 sentence
    ///

    const phraseEndingPunctuationLv1 =
      document.querySelectorAll(
        ".box .word.lv1.phrase-ending-punctuation"
      );

    phraseEndingPunctuationLv1.forEach(
      function (punctuation) {

        punctuation.addEventListener(
          "click",
          async function () {

            console.log(
              "=== Lv1 punctuation clicked ==="
            );

            const text =
              getSentenceFromPunctuation(
                this
              );

            console.log(
              "Sentence returned by getSentenceFromPunctuation():",
              text
            );

            await playLv1Sentence(
              text
            );

            console.log(
              "playLv1Sentence() completed."
            );
          }
        );
      }
    );

    ///
    // Normal Lv1 words = play Forvo audio
    ///

    const wordLv1 =
      document.querySelectorAll(
        ".box .word.lv1:not(.phrase-ending-punctuation)"
      );

    wordLv1.forEach(
      function (word) {

        word.addEventListener(
          "click",
          function () {

            const box =
              this.closest(
                ".box"
              );

            const forvoItem =
              Array.from(
                box.querySelectorAll(
                  ".forvo-item"
                )
              ).find(
                function (item) {

                  const filename =
                    (
                      item.dataset.audioSrc ||
                      ""
                    )
                      .split("/")
                      .pop();

                  return /__1__i\(.*\)__h\(.*\)\.mp3$/
                    .test(
                      filename
                    );
                }
              );

            if (!forvoItem) {
              return;
            }

            forvoItem.click();
          }
        );
      }
    );

    ///
    // TL_SaveButton
    //
    // Saves:
    //     Lv3_settings_new.json
    //
    // Uses shared directory.
    ///

    const TL_SaveButton = document.getElementById( "TL_SaveButton" );

    TL_SaveButton.addEventListener( "click", async function () {
        try {
            const saved = await flashAfterSuccessfulSave( this, saveLv3Settings );
            if (saved) {
                console.log( "Lv3_settings_new.json saved." );
            }
        } catch (error) {
            console.error( "Could not save Lv3_settings_new.json:", error );
        }
    } );

    ///
    // TL_HideButton
    ///

    const TL_HideButton =
      document.getElementById(
        "TL_HideButton"
      );

    TL_HideButton.addEventListener(
      "click",
      function () {

        const isHidden =
          localStorage.getItem(
            TL_HIDE_STATE_KEY
          ) === "true";

        localStorage.setItem(
          TL_HIDE_STATE_KEY,
          String(!isHidden)
        );

        applyTlHideState();
      }
    );

    ///
    // TL_ClearBookmarksButton
    ///

    const TL_ClearBookmarksButton =
      document.getElementById(
        "TL_ClearBookmarksButton"
      );

    TL_ClearBookmarksButton.addEventListener(
      "click",
      function () {

        document
          .querySelectorAll(
            ".lvB1.bookmarked"
          )
          .forEach(
            function (lvB1) {

              lvB1.classList.remove(
                "bookmarked"
              );
            }
          );

        localStorage.removeItem(
          BOOKMARKED_SETTINGS_KEY
        );
      }
    );

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

            box.querySelectorAll(
              ".lv3 .ipa-item"
            ).forEach(
              function (item) {

                item.classList.remove(
                  "selected"
                );
              }
            );

            this.classList.add(
              "selected"
            );

            lv2.textContent =
              this.dataset.ipa;
          }
        );
      }
    );

    ///
    // Lv5 > button:
    // select corresponding Lv3 IPA
    ///

    const lv5Buttons =
      document.querySelectorAll(
        ".lv5-button"
      );

    lv5Buttons.forEach(
      function (button) {

        button.addEventListener(
          "click",
          function (event) {

            event.stopPropagation();

            const lv5Item =
              this.closest(
                ".mp3-item"
              );

            const box =
              this.closest(
                ".box"
              );

            const ipa =
              lv5Item
                .querySelector(
                  ".lv5-ipa"
                )
                .textContent
                .trim();

            const matchingLv3Item =
              Array.from(
                box.querySelectorAll(
                  ".lv3 .ipa-item"
                )
              ).find(
                function (item) {

                  return (
                    item.dataset.ipa ===
                    ipa
                  );
                }
              );

            if (!matchingLv3Item) {
              return;
            }

            box.querySelectorAll(
              ".lv3 .ipa-item"
            ).forEach(
              function (item) {

                item.classList.remove(
                  "selected"
                );
              }
            );

            matchingLv3Item.classList.add(
              "selected"
            );

            const lv2 =
              box.querySelector(
                ".lv2"
              );

            lv2.textContent =
              ipa;
          }
        );
      }
    );

    ///
    // Lv4 Forvo audio
    ///

    const forvoItems =
      document.querySelectorAll(
        ".forvo-item"
      );

    forvoItems.forEach(
      function (item) {

        item.addEventListener(
          "click",
          function () {

            const audioSrc =
              this.dataset.audioSrc;

            const audio =
              new Audio(
                audioSrc
              );

            audio.play();
          }
        );
      }
    );

    ///
    // Lv5 non-Forvo audio
    ///

    const mp3Items =
      document.querySelectorAll(
        ".mp3-item"
      );

    mp3Items.forEach(
      function (item) {

        item.addEventListener(
          "click",
          function () {

            const audioSrc =
              this.dataset.audioSrc;

            const audio =
              new Audio(
                audioSrc
              );

            audio.play();
          }
        );
      }
    );

    ///
    // Restore saved shared-directory information
    // and apply embedded Lv3 settings.
    //
    // No directory picker is opened here.
    ///

    try {

      await restoreLv3FileHandle();

      const savedSettings =
        loadLv3Settings();

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