// Minimal pair word audio. Rebuild with:
// node scripts/generate-minimal-pairs-audio.js
(function (global) {
  global.KK_MINIMAL_PAIRS = {
  "source": "Minimal_Pairs_A-Z_錄音對照表.csv",
  "voices": [
    {
      "id": "en-US-AvaNeural",
      "label": "女聲",
      "folder": "female",
      "suffix": "female"
    },
    {
      "id": "en-US-GuyNeural",
      "label": "男聲",
      "folder": "male",
      "suffix": "male"
    }
  ],
  "audioBase": "assets/kk/minimal-pairs/",
  "zips": {
    "female": "assets/kk/minimal-pairs/minimal-pairs-female.zip",
    "male": "assets/kk/minimal-pairs/minimal-pairs-male.zip"
  },
  "stats": {
    "words": 212,
    "groups": 16,
    "vowels": 8,
    "consonants": 8
  },
  "groups": [
    {
      "id": "V01",
      "contrast": "/i/–/ɪ/",
      "kind": "vowel"
    },
    {
      "id": "V02",
      "contrast": "/ɛ/–/æ/",
      "kind": "vowel"
    },
    {
      "id": "V03",
      "contrast": "/u/–/ʊ/",
      "kind": "vowel"
    },
    {
      "id": "V04",
      "contrast": "/ɛ/–/ɪ/",
      "kind": "vowel"
    },
    {
      "id": "V05",
      "contrast": "/æ/–/ʌ/",
      "kind": "vowel"
    },
    {
      "id": "V06",
      "contrast": "/ɑ/–/ɔ/（延伸）",
      "kind": "vowel"
    },
    {
      "id": "V07",
      "contrast": "/ʊ/–/ʌ/",
      "kind": "vowel"
    },
    {
      "id": "V08",
      "contrast": "KK /e/–/ɛ/",
      "kind": "vowel"
    },
    {
      "id": "C01",
      "contrast": "/l/–/r/",
      "kind": "consonant"
    },
    {
      "id": "C02",
      "contrast": "/s/–/θ/",
      "kind": "consonant"
    },
    {
      "id": "C03",
      "contrast": "/ð/–/d/",
      "kind": "consonant"
    },
    {
      "id": "C04",
      "contrast": "/v/–/w/",
      "kind": "consonant"
    },
    {
      "id": "C05",
      "contrast": "/b/–/v/",
      "kind": "consonant"
    },
    {
      "id": "C06",
      "contrast": "/s/–/ʃ/",
      "kind": "consonant"
    },
    {
      "id": "C07",
      "contrast": "/tʃ/–/ʃ/",
      "kind": "consonant"
    },
    {
      "id": "C08",
      "contrast": "/n/–/ŋ/",
      "kind": "consonant"
    }
  ],
  "words": [
    {
      "id": "001",
      "text": "ankle",
      "groups": [
        "V05"
      ],
      "contrasts": [
        "/æ/–/ʌ/"
      ],
      "fileBase": "MP_001",
      "files": {
        "female": "MP_001_female.mp3",
        "male": "MP_001_male.mp3"
      }
    },
    {
      "id": "002",
      "text": "bad",
      "groups": [
        "V02"
      ],
      "contrasts": [
        "/ɛ/–/æ/"
      ],
      "fileBase": "MP_002",
      "files": {
        "female": "MP_002_female.mp3",
        "male": "MP_002_male.mp3"
      }
    },
    {
      "id": "003",
      "text": "bag",
      "groups": [
        "V05"
      ],
      "contrasts": [
        "/æ/–/ʌ/"
      ],
      "fileBase": "MP_003",
      "files": {
        "female": "MP_003_female.mp3",
        "male": "MP_003_male.mp3"
      }
    },
    {
      "id": "004",
      "text": "bait",
      "groups": [
        "V08"
      ],
      "contrasts": [
        "KK /e/–/ɛ/"
      ],
      "fileBase": "MP_004",
      "files": {
        "female": "MP_004_female.mp3",
        "male": "MP_004_male.mp3"
      }
    },
    {
      "id": "005",
      "text": "ban",
      "groups": [
        "C05",
        "C08"
      ],
      "contrasts": [
        "/b/–/v/",
        "/n/–/ŋ/"
      ],
      "fileBase": "MP_005",
      "files": {
        "female": "MP_005_female.mp3",
        "male": "MP_005_male.mp3"
      }
    },
    {
      "id": "006",
      "text": "band",
      "groups": [
        "V02"
      ],
      "contrasts": [
        "/ɛ/–/æ/"
      ],
      "fileBase": "MP_006",
      "files": {
        "female": "MP_006_female.mp3",
        "male": "MP_006_male.mp3"
      }
    },
    {
      "id": "007",
      "text": "bang",
      "groups": [
        "C08"
      ],
      "contrasts": [
        "/n/–/ŋ/"
      ],
      "fileBase": "MP_007",
      "files": {
        "female": "MP_007_female.mp3",
        "male": "MP_007_male.mp3"
      }
    },
    {
      "id": "008",
      "text": "bat",
      "groups": [
        "V05",
        "C05"
      ],
      "contrasts": [
        "/æ/–/ʌ/",
        "/b/–/v/"
      ],
      "fileBase": "MP_008",
      "files": {
        "female": "MP_008_female.mp3",
        "male": "MP_008_male.mp3"
      }
    },
    {
      "id": "009",
      "text": "beat",
      "groups": [
        "V01"
      ],
      "contrasts": [
        "/i/–/ɪ/"
      ],
      "fileBase": "MP_009",
      "files": {
        "female": "MP_009_female.mp3",
        "male": "MP_009_male.mp3"
      }
    },
    {
      "id": "010",
      "text": "bed",
      "groups": [
        "V02",
        "V04"
      ],
      "contrasts": [
        "/ɛ/–/æ/",
        "/ɛ/–/ɪ/"
      ],
      "fileBase": "MP_010",
      "files": {
        "female": "MP_010_female.mp3",
        "male": "MP_010_male.mp3"
      }
    },
    {
      "id": "011",
      "text": "bend",
      "groups": [
        "V02"
      ],
      "contrasts": [
        "/ɛ/–/æ/"
      ],
      "fileBase": "MP_011",
      "files": {
        "female": "MP_011_female.mp3",
        "male": "MP_011_male.mp3"
      }
    },
    {
      "id": "012",
      "text": "berry",
      "groups": [
        "C05"
      ],
      "contrasts": [
        "/b/–/v/"
      ],
      "fileBase": "MP_012",
      "files": {
        "female": "MP_012_female.mp3",
        "male": "MP_012_male.mp3"
      }
    },
    {
      "id": "013",
      "text": "best",
      "groups": [
        "C05"
      ],
      "contrasts": [
        "/b/–/v/"
      ],
      "fileBase": "MP_013",
      "files": {
        "female": "MP_013_female.mp3",
        "male": "MP_013_male.mp3"
      }
    },
    {
      "id": "014",
      "text": "bet",
      "groups": [
        "V04",
        "V08"
      ],
      "contrasts": [
        "/ɛ/–/ɪ/",
        "KK /e/–/ɛ/"
      ],
      "fileBase": "MP_014",
      "files": {
        "female": "MP_014_female.mp3",
        "male": "MP_014_male.mp3"
      }
    },
    {
      "id": "015",
      "text": "bid",
      "groups": [
        "V04"
      ],
      "contrasts": [
        "/ɛ/–/ɪ/"
      ],
      "fileBase": "MP_015",
      "files": {
        "female": "MP_015_female.mp3",
        "male": "MP_015_male.mp3"
      }
    },
    {
      "id": "016",
      "text": "bit",
      "groups": [
        "V01",
        "V04"
      ],
      "contrasts": [
        "/i/–/ɪ/",
        "/ɛ/–/ɪ/"
      ],
      "fileBase": "MP_016",
      "files": {
        "female": "MP_016_female.mp3",
        "male": "MP_016_male.mp3"
      }
    },
    {
      "id": "017",
      "text": "boat",
      "groups": [
        "C05"
      ],
      "contrasts": [
        "/b/–/v/"
      ],
      "fileBase": "MP_017",
      "files": {
        "female": "MP_017_female.mp3",
        "male": "MP_017_male.mp3"
      }
    },
    {
      "id": "018",
      "text": "book",
      "groups": [
        "V07"
      ],
      "contrasts": [
        "/ʊ/–/ʌ/"
      ],
      "fileBase": "MP_018",
      "files": {
        "female": "MP_018_female.mp3",
        "male": "MP_018_male.mp3"
      }
    },
    {
      "id": "019",
      "text": "buck",
      "groups": [
        "V07"
      ],
      "contrasts": [
        "/ʊ/–/ʌ/"
      ],
      "fileBase": "MP_019",
      "files": {
        "female": "MP_019_female.mp3",
        "male": "MP_019_male.mp3"
      }
    },
    {
      "id": "020",
      "text": "bug",
      "groups": [
        "V05"
      ],
      "contrasts": [
        "/æ/–/ʌ/"
      ],
      "fileBase": "MP_020",
      "files": {
        "female": "MP_020_female.mp3",
        "male": "MP_020_male.mp3"
      }
    },
    {
      "id": "021",
      "text": "but",
      "groups": [
        "V05"
      ],
      "contrasts": [
        "/æ/–/ʌ/"
      ],
      "fileBase": "MP_021",
      "files": {
        "female": "MP_021_female.mp3",
        "male": "MP_021_male.mp3"
      }
    },
    {
      "id": "022",
      "text": "caller",
      "groups": [
        "V06"
      ],
      "contrasts": [
        "/ɑ/–/ɔ/（延伸）"
      ],
      "fileBase": "MP_022",
      "files": {
        "female": "MP_022_female.mp3",
        "male": "MP_022_male.mp3"
      }
    },
    {
      "id": "023",
      "text": "cap",
      "groups": [
        "V05"
      ],
      "contrasts": [
        "/æ/–/ʌ/"
      ],
      "fileBase": "MP_023",
      "files": {
        "female": "MP_023_female.mp3",
        "male": "MP_023_male.mp3"
      }
    },
    {
      "id": "024",
      "text": "cat",
      "groups": [
        "V05"
      ],
      "contrasts": [
        "/æ/–/ʌ/"
      ],
      "fileBase": "MP_024",
      "files": {
        "female": "MP_024_female.mp3",
        "male": "MP_024_male.mp3"
      }
    },
    {
      "id": "025",
      "text": "caught",
      "groups": [
        "V06"
      ],
      "contrasts": [
        "/ɑ/–/ɔ/（延伸）"
      ],
      "fileBase": "MP_025",
      "files": {
        "female": "MP_025_female.mp3",
        "male": "MP_025_male.mp3"
      }
    },
    {
      "id": "026",
      "text": "chair",
      "groups": [
        "C07"
      ],
      "contrasts": [
        "/tʃ/–/ʃ/"
      ],
      "fileBase": "MP_026",
      "files": {
        "female": "MP_026_female.mp3",
        "male": "MP_026_male.mp3"
      }
    },
    {
      "id": "027",
      "text": "cheap",
      "groups": [
        "C07"
      ],
      "contrasts": [
        "/tʃ/–/ʃ/"
      ],
      "fileBase": "MP_027",
      "files": {
        "female": "MP_027_female.mp3",
        "male": "MP_027_male.mp3"
      }
    },
    {
      "id": "028",
      "text": "chip",
      "groups": [
        "C07"
      ],
      "contrasts": [
        "/tʃ/–/ʃ/"
      ],
      "fileBase": "MP_028",
      "files": {
        "female": "MP_028_female.mp3",
        "male": "MP_028_male.mp3"
      }
    },
    {
      "id": "029",
      "text": "choose",
      "groups": [
        "C07"
      ],
      "contrasts": [
        "/tʃ/–/ʃ/"
      ],
      "fileBase": "MP_029",
      "files": {
        "female": "MP_029_female.mp3",
        "male": "MP_029_male.mp3"
      }
    },
    {
      "id": "030",
      "text": "chop",
      "groups": [
        "C07"
      ],
      "contrasts": [
        "/tʃ/–/ʃ/"
      ],
      "fileBase": "MP_030",
      "files": {
        "female": "MP_030_female.mp3",
        "male": "MP_030_male.mp3"
      }
    },
    {
      "id": "031",
      "text": "collar",
      "groups": [
        "V06"
      ],
      "contrasts": [
        "/ɑ/–/ɔ/（延伸）"
      ],
      "fileBase": "MP_031",
      "files": {
        "female": "MP_031_female.mp3",
        "male": "MP_031_male.mp3"
      }
    },
    {
      "id": "032",
      "text": "cooed",
      "groups": [
        "V03"
      ],
      "contrasts": [
        "/u/–/ʊ/"
      ],
      "fileBase": "MP_032",
      "files": {
        "female": "MP_032_female.mp3",
        "male": "MP_032_male.mp3"
      }
    },
    {
      "id": "033",
      "text": "cot",
      "groups": [
        "V06"
      ],
      "contrasts": [
        "/ɑ/–/ɔ/（延伸）"
      ],
      "fileBase": "MP_033",
      "files": {
        "female": "MP_033_female.mp3",
        "male": "MP_033_male.mp3"
      }
    },
    {
      "id": "034",
      "text": "could",
      "groups": [
        "V03",
        "V07"
      ],
      "contrasts": [
        "/u/–/ʊ/",
        "/ʊ/–/ʌ/"
      ],
      "fileBase": "MP_034",
      "files": {
        "female": "MP_034_female.mp3",
        "male": "MP_034_male.mp3"
      }
    },
    {
      "id": "035",
      "text": "cud",
      "groups": [
        "V07"
      ],
      "contrasts": [
        "/ʊ/–/ʌ/"
      ],
      "fileBase": "MP_035",
      "files": {
        "female": "MP_035_female.mp3",
        "male": "MP_035_male.mp3"
      }
    },
    {
      "id": "036",
      "text": "cup",
      "groups": [
        "V05"
      ],
      "contrasts": [
        "/æ/–/ʌ/"
      ],
      "fileBase": "MP_036",
      "files": {
        "female": "MP_036_female.mp3",
        "male": "MP_036_male.mp3"
      }
    },
    {
      "id": "037",
      "text": "cut",
      "groups": [
        "V05"
      ],
      "contrasts": [
        "/æ/–/ʌ/"
      ],
      "fileBase": "MP_037",
      "files": {
        "female": "MP_037_female.mp3",
        "male": "MP_037_male.mp3"
      }
    },
    {
      "id": "038",
      "text": "dare",
      "groups": [
        "C03"
      ],
      "contrasts": [
        "/ð/–/d/"
      ],
      "fileBase": "MP_038",
      "files": {
        "female": "MP_038_female.mp3",
        "male": "MP_038_male.mp3"
      }
    },
    {
      "id": "039",
      "text": "dawn",
      "groups": [
        "V06"
      ],
      "contrasts": [
        "/ɑ/–/ɔ/（延伸）"
      ],
      "fileBase": "MP_039",
      "files": {
        "female": "MP_039_female.mp3",
        "male": "MP_039_male.mp3"
      }
    },
    {
      "id": "040",
      "text": "day",
      "groups": [
        "C03"
      ],
      "contrasts": [
        "/ð/–/d/"
      ],
      "fileBase": "MP_040",
      "files": {
        "female": "MP_040_female.mp3",
        "male": "MP_040_male.mp3"
      }
    },
    {
      "id": "041",
      "text": "den",
      "groups": [
        "C03"
      ],
      "contrasts": [
        "/ð/–/d/"
      ],
      "fileBase": "MP_041",
      "files": {
        "female": "MP_041_female.mp3",
        "male": "MP_041_male.mp3"
      }
    },
    {
      "id": "042",
      "text": "Don",
      "groups": [
        "V06"
      ],
      "contrasts": [
        "/ɑ/–/ɔ/（延伸）"
      ],
      "fileBase": "MP_042",
      "files": {
        "female": "MP_042_female.mp3",
        "male": "MP_042_male.mp3"
      }
    },
    {
      "id": "043",
      "text": "dough",
      "groups": [
        "C03"
      ],
      "contrasts": [
        "/ð/–/d/"
      ],
      "fileBase": "MP_043",
      "files": {
        "female": "MP_043_female.mp3",
        "male": "MP_043_male.mp3"
      }
    },
    {
      "id": "044",
      "text": "doze",
      "groups": [
        "C03"
      ],
      "contrasts": [
        "/ð/–/d/"
      ],
      "fileBase": "MP_044",
      "files": {
        "female": "MP_044_female.mp3",
        "male": "MP_044_male.mp3"
      }
    },
    {
      "id": "045",
      "text": "fail",
      "groups": [
        "V08"
      ],
      "contrasts": [
        "KK /e/–/ɛ/"
      ],
      "fileBase": "MP_045",
      "files": {
        "female": "MP_045_female.mp3",
        "male": "MP_045_male.mp3"
      }
    },
    {
      "id": "046",
      "text": "feel",
      "groups": [
        "V01"
      ],
      "contrasts": [
        "/i/–/ɪ/"
      ],
      "fileBase": "MP_046",
      "files": {
        "female": "MP_046_female.mp3",
        "male": "MP_046_male.mp3"
      }
    },
    {
      "id": "047",
      "text": "feet",
      "groups": [
        "V01"
      ],
      "contrasts": [
        "/i/–/ɪ/"
      ],
      "fileBase": "MP_047",
      "files": {
        "female": "MP_047_female.mp3",
        "male": "MP_047_male.mp3"
      }
    },
    {
      "id": "048",
      "text": "fell",
      "groups": [
        "V04",
        "V08"
      ],
      "contrasts": [
        "/ɛ/–/ɪ/",
        "KK /e/–/ɛ/"
      ],
      "fileBase": "MP_048",
      "files": {
        "female": "MP_048_female.mp3",
        "male": "MP_048_male.mp3"
      }
    },
    {
      "id": "049",
      "text": "fill",
      "groups": [
        "V01",
        "V04"
      ],
      "contrasts": [
        "/i/–/ɪ/",
        "/ɛ/–/ɪ/"
      ],
      "fileBase": "MP_049",
      "files": {
        "female": "MP_049_female.mp3",
        "male": "MP_049_male.mp3"
      }
    },
    {
      "id": "050",
      "text": "fit",
      "groups": [
        "V01"
      ],
      "contrasts": [
        "/i/–/ɪ/"
      ],
      "fileBase": "MP_050",
      "files": {
        "female": "MP_050_female.mp3",
        "male": "MP_050_male.mp3"
      }
    },
    {
      "id": "051",
      "text": "fly",
      "groups": [
        "C01"
      ],
      "contrasts": [
        "/l/–/r/"
      ],
      "fileBase": "MP_051",
      "files": {
        "female": "MP_051_female.mp3",
        "male": "MP_051_male.mp3"
      }
    },
    {
      "id": "052",
      "text": "fool",
      "groups": [
        "V03"
      ],
      "contrasts": [
        "/u/–/ʊ/"
      ],
      "fileBase": "MP_052",
      "files": {
        "female": "MP_052_female.mp3",
        "male": "MP_052_male.mp3"
      }
    },
    {
      "id": "053",
      "text": "fry",
      "groups": [
        "C01"
      ],
      "contrasts": [
        "/l/–/r/"
      ],
      "fileBase": "MP_053",
      "files": {
        "female": "MP_053_female.mp3",
        "male": "MP_053_male.mp3"
      }
    },
    {
      "id": "054",
      "text": "full",
      "groups": [
        "V03"
      ],
      "contrasts": [
        "/u/–/ʊ/"
      ],
      "fileBase": "MP_054",
      "files": {
        "female": "MP_054_female.mp3",
        "male": "MP_054_male.mp3"
      }
    },
    {
      "id": "055",
      "text": "glass",
      "groups": [
        "C01"
      ],
      "contrasts": [
        "/l/–/r/"
      ],
      "fileBase": "MP_055",
      "files": {
        "female": "MP_055_female.mp3",
        "male": "MP_055_male.mp3"
      }
    },
    {
      "id": "056",
      "text": "grass",
      "groups": [
        "C01"
      ],
      "contrasts": [
        "/l/–/r/"
      ],
      "fileBase": "MP_056",
      "files": {
        "female": "MP_056_female.mp3",
        "male": "MP_056_male.mp3"
      }
    },
    {
      "id": "057",
      "text": "had",
      "groups": [
        "V02"
      ],
      "contrasts": [
        "/ɛ/–/æ/"
      ],
      "fileBase": "MP_057",
      "files": {
        "female": "MP_057_female.mp3",
        "male": "MP_057_male.mp3"
      }
    },
    {
      "id": "058",
      "text": "hat",
      "groups": [
        "V05"
      ],
      "contrasts": [
        "/æ/–/ʌ/"
      ],
      "fileBase": "MP_058",
      "files": {
        "female": "MP_058_female.mp3",
        "male": "MP_058_male.mp3"
      }
    },
    {
      "id": "059",
      "text": "head",
      "groups": [
        "V02",
        "V04"
      ],
      "contrasts": [
        "/ɛ/–/æ/",
        "/ɛ/–/ɪ/"
      ],
      "fileBase": "MP_059",
      "files": {
        "female": "MP_059_female.mp3",
        "male": "MP_059_male.mp3"
      }
    },
    {
      "id": "060",
      "text": "heat",
      "groups": [
        "V01"
      ],
      "contrasts": [
        "/i/–/ɪ/"
      ],
      "fileBase": "MP_060",
      "files": {
        "female": "MP_060_female.mp3",
        "male": "MP_060_male.mp3"
      }
    },
    {
      "id": "061",
      "text": "hid",
      "groups": [
        "V04"
      ],
      "contrasts": [
        "/ɛ/–/ɪ/"
      ],
      "fileBase": "MP_061",
      "files": {
        "female": "MP_061_female.mp3",
        "male": "MP_061_male.mp3"
      }
    },
    {
      "id": "062",
      "text": "hit",
      "groups": [
        "V01"
      ],
      "contrasts": [
        "/i/–/ɪ/"
      ],
      "fileBase": "MP_062",
      "files": {
        "female": "MP_062_female.mp3",
        "male": "MP_062_male.mp3"
      }
    },
    {
      "id": "063",
      "text": "hut",
      "groups": [
        "V05"
      ],
      "contrasts": [
        "/æ/–/ʌ/"
      ],
      "fileBase": "MP_063",
      "files": {
        "female": "MP_063_female.mp3",
        "male": "MP_063_male.mp3"
      }
    },
    {
      "id": "064",
      "text": "knot",
      "groups": [
        "V06"
      ],
      "contrasts": [
        "/ɑ/–/ɔ/（延伸）"
      ],
      "fileBase": "MP_064",
      "files": {
        "female": "MP_064_female.mp3",
        "male": "MP_064_male.mp3"
      }
    },
    {
      "id": "065",
      "text": "lake",
      "groups": [
        "C01"
      ],
      "contrasts": [
        "/l/–/r/"
      ],
      "fileBase": "MP_065",
      "files": {
        "female": "MP_065_female.mp3",
        "male": "MP_065_male.mp3"
      }
    },
    {
      "id": "066",
      "text": "late",
      "groups": [
        "V08"
      ],
      "contrasts": [
        "KK /e/–/ɛ/"
      ],
      "fileBase": "MP_066",
      "files": {
        "female": "MP_066_female.mp3",
        "male": "MP_066_male.mp3"
      }
    },
    {
      "id": "067",
      "text": "laughed",
      "groups": [
        "V02"
      ],
      "contrasts": [
        "/ɛ/–/æ/"
      ],
      "fileBase": "MP_067",
      "files": {
        "female": "MP_067_female.mp3",
        "male": "MP_067_male.mp3"
      }
    },
    {
      "id": "068",
      "text": "lead",
      "groups": [
        "C01"
      ],
      "contrasts": [
        "/l/–/r/"
      ],
      "fileBase": "MP_068",
      "files": {
        "female": "MP_068_female.mp3",
        "male": "MP_068_male.mp3"
      }
    },
    {
      "id": "069",
      "text": "least",
      "groups": [
        "V01"
      ],
      "contrasts": [
        "/i/–/ɪ/"
      ],
      "fileBase": "MP_069",
      "files": {
        "female": "MP_069_female.mp3",
        "male": "MP_069_male.mp3"
      }
    },
    {
      "id": "070",
      "text": "leave",
      "groups": [
        "V01"
      ],
      "contrasts": [
        "/i/–/ɪ/"
      ],
      "fileBase": "MP_070",
      "files": {
        "female": "MP_070_female.mp3",
        "male": "MP_070_male.mp3"
      }
    },
    {
      "id": "071",
      "text": "left",
      "groups": [
        "V02"
      ],
      "contrasts": [
        "/ɛ/–/æ/"
      ],
      "fileBase": "MP_071",
      "files": {
        "female": "MP_071_female.mp3",
        "male": "MP_071_male.mp3"
      }
    },
    {
      "id": "072",
      "text": "let",
      "groups": [
        "V08"
      ],
      "contrasts": [
        "KK /e/–/ɛ/"
      ],
      "fileBase": "MP_072",
      "files": {
        "female": "MP_072_female.mp3",
        "male": "MP_072_male.mp3"
      }
    },
    {
      "id": "073",
      "text": "lice",
      "groups": [
        "C01"
      ],
      "contrasts": [
        "/l/–/r/"
      ],
      "fileBase": "MP_073",
      "files": {
        "female": "MP_073_female.mp3",
        "male": "MP_073_male.mp3"
      }
    },
    {
      "id": "074",
      "text": "light",
      "groups": [
        "C01"
      ],
      "contrasts": [
        "/l/–/r/"
      ],
      "fileBase": "MP_074",
      "files": {
        "female": "MP_074_female.mp3",
        "male": "MP_074_male.mp3"
      }
    },
    {
      "id": "075",
      "text": "lip",
      "groups": [
        "C01"
      ],
      "contrasts": [
        "/l/–/r/"
      ],
      "fileBase": "MP_075",
      "files": {
        "female": "MP_075_female.mp3",
        "male": "MP_075_male.mp3"
      }
    },
    {
      "id": "076",
      "text": "list",
      "groups": [
        "V01"
      ],
      "contrasts": [
        "/i/–/ɪ/"
      ],
      "fileBase": "MP_076",
      "files": {
        "female": "MP_076_female.mp3",
        "male": "MP_076_male.mp3"
      }
    },
    {
      "id": "077",
      "text": "live",
      "groups": [
        "V01"
      ],
      "contrasts": [
        "/i/–/ɪ/"
      ],
      "fileBase": "MP_077",
      "files": {
        "female": "MP_077_female.mp3",
        "male": "MP_077_male.mp3"
      }
    },
    {
      "id": "078",
      "text": "lock",
      "groups": [
        "C01"
      ],
      "contrasts": [
        "/l/–/r/"
      ],
      "fileBase": "MP_078",
      "files": {
        "female": "MP_078_female.mp3",
        "male": "MP_078_male.mp3"
      }
    },
    {
      "id": "079",
      "text": "long",
      "groups": [
        "C01"
      ],
      "contrasts": [
        "/l/–/r/"
      ],
      "fileBase": "MP_079",
      "files": {
        "female": "MP_079_female.mp3",
        "male": "MP_079_male.mp3"
      }
    },
    {
      "id": "080",
      "text": "look",
      "groups": [
        "V03",
        "V07"
      ],
      "contrasts": [
        "/u/–/ʊ/",
        "/ʊ/–/ʌ/"
      ],
      "fileBase": "MP_080",
      "files": {
        "female": "MP_080_female.mp3",
        "male": "MP_080_male.mp3"
      }
    },
    {
      "id": "081",
      "text": "luck",
      "groups": [
        "V07"
      ],
      "contrasts": [
        "/ʊ/–/ʌ/"
      ],
      "fileBase": "MP_081",
      "files": {
        "female": "MP_081_female.mp3",
        "male": "MP_081_male.mp3"
      }
    },
    {
      "id": "082",
      "text": "Luke",
      "groups": [
        "V03"
      ],
      "contrasts": [
        "/u/–/ʊ/"
      ],
      "fileBase": "MP_082",
      "files": {
        "female": "MP_082_female.mp3",
        "male": "MP_082_male.mp3"
      }
    },
    {
      "id": "083",
      "text": "mad",
      "groups": [
        "V05"
      ],
      "contrasts": [
        "/æ/–/ʌ/"
      ],
      "fileBase": "MP_083",
      "files": {
        "female": "MP_083_female.mp3",
        "male": "MP_083_male.mp3"
      }
    },
    {
      "id": "084",
      "text": "main",
      "groups": [
        "V08"
      ],
      "contrasts": [
        "KK /e/–/ɛ/"
      ],
      "fileBase": "MP_084",
      "files": {
        "female": "MP_084_female.mp3",
        "male": "MP_084_male.mp3"
      }
    },
    {
      "id": "085",
      "text": "man",
      "groups": [
        "V02"
      ],
      "contrasts": [
        "/ɛ/–/æ/"
      ],
      "fileBase": "MP_085",
      "files": {
        "female": "MP_085_female.mp3",
        "male": "MP_085_male.mp3"
      }
    },
    {
      "id": "086",
      "text": "mash",
      "groups": [
        "C06"
      ],
      "contrasts": [
        "/s/–/ʃ/"
      ],
      "fileBase": "MP_086",
      "files": {
        "female": "MP_086_female.mp3",
        "male": "MP_086_male.mp3"
      }
    },
    {
      "id": "087",
      "text": "mass",
      "groups": [
        "C02",
        "C06"
      ],
      "contrasts": [
        "/s/–/θ/",
        "/s/–/ʃ/"
      ],
      "fileBase": "MP_087",
      "files": {
        "female": "MP_087_female.mp3",
        "male": "MP_087_male.mp3"
      }
    },
    {
      "id": "088",
      "text": "match",
      "groups": [
        "V05"
      ],
      "contrasts": [
        "/æ/–/ʌ/"
      ],
      "fileBase": "MP_088",
      "files": {
        "female": "MP_088_female.mp3",
        "male": "MP_088_male.mp3"
      }
    },
    {
      "id": "089",
      "text": "mate",
      "groups": [
        "V08"
      ],
      "contrasts": [
        "KK /e/–/ɛ/"
      ],
      "fileBase": "MP_089",
      "files": {
        "female": "MP_089_female.mp3",
        "male": "MP_089_male.mp3"
      }
    },
    {
      "id": "090",
      "text": "math",
      "groups": [
        "C02"
      ],
      "contrasts": [
        "/s/–/θ/"
      ],
      "fileBase": "MP_090",
      "files": {
        "female": "MP_090_female.mp3",
        "male": "MP_090_male.mp3"
      }
    },
    {
      "id": "091",
      "text": "men",
      "groups": [
        "V02",
        "V08"
      ],
      "contrasts": [
        "/ɛ/–/æ/",
        "KK /e/–/ɛ/"
      ],
      "fileBase": "MP_091",
      "files": {
        "female": "MP_091_female.mp3",
        "male": "MP_091_male.mp3"
      }
    },
    {
      "id": "092",
      "text": "mess",
      "groups": [
        "V04"
      ],
      "contrasts": [
        "/ɛ/–/ɪ/"
      ],
      "fileBase": "MP_092",
      "files": {
        "female": "MP_092_female.mp3",
        "male": "MP_092_male.mp3"
      }
    },
    {
      "id": "093",
      "text": "met",
      "groups": [
        "V04",
        "V08"
      ],
      "contrasts": [
        "/ɛ/–/ɪ/",
        "KK /e/–/ɛ/"
      ],
      "fileBase": "MP_093",
      "files": {
        "female": "MP_093_female.mp3",
        "male": "MP_093_male.mp3"
      }
    },
    {
      "id": "094",
      "text": "miss",
      "groups": [
        "V04"
      ],
      "contrasts": [
        "/ɛ/–/ɪ/"
      ],
      "fileBase": "MP_094",
      "files": {
        "female": "MP_094_female.mp3",
        "male": "MP_094_male.mp3"
      }
    },
    {
      "id": "095",
      "text": "mitt",
      "groups": [
        "V04"
      ],
      "contrasts": [
        "/ɛ/–/ɪ/"
      ],
      "fileBase": "MP_095",
      "files": {
        "female": "MP_095_female.mp3",
        "male": "MP_095_male.mp3"
      }
    },
    {
      "id": "096",
      "text": "mouse",
      "groups": [
        "C02"
      ],
      "contrasts": [
        "/s/–/θ/"
      ],
      "fileBase": "MP_096",
      "files": {
        "female": "MP_096_female.mp3",
        "male": "MP_096_male.mp3"
      }
    },
    {
      "id": "097",
      "text": "mouth",
      "groups": [
        "C02"
      ],
      "contrasts": [
        "/s/–/θ/"
      ],
      "fileBase": "MP_097",
      "files": {
        "female": "MP_097_female.mp3",
        "male": "MP_097_male.mp3"
      }
    },
    {
      "id": "098",
      "text": "much",
      "groups": [
        "V05"
      ],
      "contrasts": [
        "/æ/–/ʌ/"
      ],
      "fileBase": "MP_098",
      "files": {
        "female": "MP_098_female.mp3",
        "male": "MP_098_male.mp3"
      }
    },
    {
      "id": "099",
      "text": "mud",
      "groups": [
        "V05"
      ],
      "contrasts": [
        "/æ/–/ʌ/"
      ],
      "fileBase": "MP_099",
      "files": {
        "female": "MP_099_female.mp3",
        "male": "MP_099_male.mp3"
      }
    },
    {
      "id": "100",
      "text": "naught",
      "groups": [
        "V06"
      ],
      "contrasts": [
        "/ɑ/–/ɔ/（延伸）"
      ],
      "fileBase": "MP_100",
      "files": {
        "female": "MP_100_female.mp3",
        "male": "MP_100_male.mp3"
      }
    },
    {
      "id": "101",
      "text": "pain",
      "groups": [
        "V08"
      ],
      "contrasts": [
        "KK /e/–/ɛ/"
      ],
      "fileBase": "MP_101",
      "files": {
        "female": "MP_101_female.mp3",
        "male": "MP_101_male.mp3"
      }
    },
    {
      "id": "102",
      "text": "pan",
      "groups": [
        "V02"
      ],
      "contrasts": [
        "/ɛ/–/æ/"
      ],
      "fileBase": "MP_102",
      "files": {
        "female": "MP_102_female.mp3",
        "male": "MP_102_male.mp3"
      }
    },
    {
      "id": "103",
      "text": "pass",
      "groups": [
        "C02"
      ],
      "contrasts": [
        "/s/–/θ/"
      ],
      "fileBase": "MP_103",
      "files": {
        "female": "MP_103_female.mp3",
        "male": "MP_103_male.mp3"
      }
    },
    {
      "id": "104",
      "text": "path",
      "groups": [
        "C02"
      ],
      "contrasts": [
        "/s/–/θ/"
      ],
      "fileBase": "MP_104",
      "files": {
        "female": "MP_104_female.mp3",
        "male": "MP_104_male.mp3"
      }
    },
    {
      "id": "105",
      "text": "pen",
      "groups": [
        "V02",
        "V04",
        "V08"
      ],
      "contrasts": [
        "/ɛ/–/æ/",
        "/ɛ/–/ɪ/",
        "KK /e/–/ɛ/"
      ],
      "fileBase": "MP_105",
      "files": {
        "female": "MP_105_female.mp3",
        "male": "MP_105_male.mp3"
      }
    },
    {
      "id": "106",
      "text": "pet",
      "groups": [
        "V04"
      ],
      "contrasts": [
        "/ɛ/–/ɪ/"
      ],
      "fileBase": "MP_106",
      "files": {
        "female": "MP_106_female.mp3",
        "male": "MP_106_male.mp3"
      }
    },
    {
      "id": "107",
      "text": "pin",
      "groups": [
        "V04"
      ],
      "contrasts": [
        "/ɛ/–/ɪ/"
      ],
      "fileBase": "MP_107",
      "files": {
        "female": "MP_107_female.mp3",
        "male": "MP_107_male.mp3"
      }
    },
    {
      "id": "108",
      "text": "pit",
      "groups": [
        "V04"
      ],
      "contrasts": [
        "/ɛ/–/ɪ/"
      ],
      "fileBase": "MP_108",
      "files": {
        "female": "MP_108_female.mp3",
        "male": "MP_108_male.mp3"
      }
    },
    {
      "id": "109",
      "text": "play",
      "groups": [
        "C01"
      ],
      "contrasts": [
        "/l/–/r/"
      ],
      "fileBase": "MP_109",
      "files": {
        "female": "MP_109_female.mp3",
        "male": "MP_109_male.mp3"
      }
    },
    {
      "id": "110",
      "text": "pool",
      "groups": [
        "V03"
      ],
      "contrasts": [
        "/u/–/ʊ/"
      ],
      "fileBase": "MP_110",
      "files": {
        "female": "MP_110_female.mp3",
        "male": "MP_110_male.mp3"
      }
    },
    {
      "id": "111",
      "text": "pray",
      "groups": [
        "C01"
      ],
      "contrasts": [
        "/l/–/r/"
      ],
      "fileBase": "MP_111",
      "files": {
        "female": "MP_111_female.mp3",
        "male": "MP_111_male.mp3"
      }
    },
    {
      "id": "112",
      "text": "pull",
      "groups": [
        "V03"
      ],
      "contrasts": [
        "/u/–/ʊ/"
      ],
      "fileBase": "MP_112",
      "files": {
        "female": "MP_112_female.mp3",
        "male": "MP_112_male.mp3"
      }
    },
    {
      "id": "113",
      "text": "put",
      "groups": [
        "V07"
      ],
      "contrasts": [
        "/ʊ/–/ʌ/"
      ],
      "fileBase": "MP_113",
      "files": {
        "female": "MP_113_female.mp3",
        "male": "MP_113_male.mp3"
      }
    },
    {
      "id": "114",
      "text": "putt",
      "groups": [
        "V07"
      ],
      "contrasts": [
        "/ʊ/–/ʌ/"
      ],
      "fileBase": "MP_114",
      "files": {
        "female": "MP_114_female.mp3",
        "male": "MP_114_male.mp3"
      }
    },
    {
      "id": "115",
      "text": "raid",
      "groups": [
        "V08"
      ],
      "contrasts": [
        "KK /e/–/ɛ/"
      ],
      "fileBase": "MP_115",
      "files": {
        "female": "MP_115_female.mp3",
        "male": "MP_115_male.mp3"
      }
    },
    {
      "id": "116",
      "text": "rake",
      "groups": [
        "C01"
      ],
      "contrasts": [
        "/l/–/r/"
      ],
      "fileBase": "MP_116",
      "files": {
        "female": "MP_116_female.mp3",
        "male": "MP_116_male.mp3"
      }
    },
    {
      "id": "117",
      "text": "ran",
      "groups": [
        "V05",
        "C08"
      ],
      "contrasts": [
        "/æ/–/ʌ/",
        "/n/–/ŋ/"
      ],
      "fileBase": "MP_117",
      "files": {
        "female": "MP_117_female.mp3",
        "male": "MP_117_male.mp3"
      }
    },
    {
      "id": "118",
      "text": "rang",
      "groups": [
        "C08"
      ],
      "contrasts": [
        "/n/–/ŋ/"
      ],
      "fileBase": "MP_118",
      "files": {
        "female": "MP_118_female.mp3",
        "male": "MP_118_male.mp3"
      }
    },
    {
      "id": "119",
      "text": "reach",
      "groups": [
        "V01"
      ],
      "contrasts": [
        "/i/–/ɪ/"
      ],
      "fileBase": "MP_119",
      "files": {
        "female": "MP_119_female.mp3",
        "male": "MP_119_male.mp3"
      }
    },
    {
      "id": "120",
      "text": "read",
      "groups": [
        "C01"
      ],
      "contrasts": [
        "/l/–/r/"
      ],
      "fileBase": "MP_120",
      "files": {
        "female": "MP_120_female.mp3",
        "male": "MP_120_male.mp3"
      }
    },
    {
      "id": "121",
      "text": "red",
      "groups": [
        "V08"
      ],
      "contrasts": [
        "KK /e/–/ɛ/"
      ],
      "fileBase": "MP_121",
      "files": {
        "female": "MP_121_female.mp3",
        "male": "MP_121_male.mp3"
      }
    },
    {
      "id": "122",
      "text": "rice",
      "groups": [
        "C01"
      ],
      "contrasts": [
        "/l/–/r/"
      ],
      "fileBase": "MP_122",
      "files": {
        "female": "MP_122_female.mp3",
        "male": "MP_122_male.mp3"
      }
    },
    {
      "id": "123",
      "text": "rich",
      "groups": [
        "V01"
      ],
      "contrasts": [
        "/i/–/ɪ/"
      ],
      "fileBase": "MP_123",
      "files": {
        "female": "MP_123_female.mp3",
        "male": "MP_123_male.mp3"
      }
    },
    {
      "id": "124",
      "text": "right",
      "groups": [
        "C01"
      ],
      "contrasts": [
        "/l/–/r/"
      ],
      "fileBase": "MP_124",
      "files": {
        "female": "MP_124_female.mp3",
        "male": "MP_124_male.mp3"
      }
    },
    {
      "id": "125",
      "text": "rip",
      "groups": [
        "C01"
      ],
      "contrasts": [
        "/l/–/r/"
      ],
      "fileBase": "MP_125",
      "files": {
        "female": "MP_125_female.mp3",
        "male": "MP_125_male.mp3"
      }
    },
    {
      "id": "126",
      "text": "rock",
      "groups": [
        "C01"
      ],
      "contrasts": [
        "/l/–/r/"
      ],
      "fileBase": "MP_126",
      "files": {
        "female": "MP_126_female.mp3",
        "male": "MP_126_male.mp3"
      }
    },
    {
      "id": "127",
      "text": "run",
      "groups": [
        "V05"
      ],
      "contrasts": [
        "/æ/–/ʌ/"
      ],
      "fileBase": "MP_127",
      "files": {
        "female": "MP_127_female.mp3",
        "male": "MP_127_male.mp3"
      }
    },
    {
      "id": "128",
      "text": "sad",
      "groups": [
        "V02"
      ],
      "contrasts": [
        "/ɛ/–/æ/"
      ],
      "fileBase": "MP_128",
      "files": {
        "female": "MP_128_female.mp3",
        "male": "MP_128_male.mp3"
      }
    },
    {
      "id": "129",
      "text": "said",
      "groups": [
        "V02"
      ],
      "contrasts": [
        "/ɛ/–/æ/"
      ],
      "fileBase": "MP_129",
      "files": {
        "female": "MP_129_female.mp3",
        "male": "MP_129_male.mp3"
      }
    },
    {
      "id": "130",
      "text": "sale",
      "groups": [
        "V08"
      ],
      "contrasts": [
        "KK /e/–/ɛ/"
      ],
      "fileBase": "MP_130",
      "files": {
        "female": "MP_130_female.mp3",
        "male": "MP_130_male.mp3"
      }
    },
    {
      "id": "131",
      "text": "sand",
      "groups": [
        "V02"
      ],
      "contrasts": [
        "/ɛ/–/æ/"
      ],
      "fileBase": "MP_131",
      "files": {
        "female": "MP_131_female.mp3",
        "male": "MP_131_male.mp3"
      }
    },
    {
      "id": "132",
      "text": "sang",
      "groups": [
        "V05"
      ],
      "contrasts": [
        "/æ/–/ʌ/"
      ],
      "fileBase": "MP_132",
      "files": {
        "female": "MP_132_female.mp3",
        "male": "MP_132_male.mp3"
      }
    },
    {
      "id": "133",
      "text": "sank",
      "groups": [
        "C02"
      ],
      "contrasts": [
        "/s/–/θ/"
      ],
      "fileBase": "MP_133",
      "files": {
        "female": "MP_133_female.mp3",
        "male": "MP_133_male.mp3"
      }
    },
    {
      "id": "134",
      "text": "sat",
      "groups": [
        "V02"
      ],
      "contrasts": [
        "/ɛ/–/æ/"
      ],
      "fileBase": "MP_134",
      "files": {
        "female": "MP_134_female.mp3",
        "male": "MP_134_male.mp3"
      }
    },
    {
      "id": "135",
      "text": "seat",
      "groups": [
        "V01",
        "C06"
      ],
      "contrasts": [
        "/i/–/ɪ/",
        "/s/–/ʃ/"
      ],
      "fileBase": "MP_135",
      "files": {
        "female": "MP_135_female.mp3",
        "male": "MP_135_male.mp3"
      }
    },
    {
      "id": "136",
      "text": "see",
      "groups": [
        "C06"
      ],
      "contrasts": [
        "/s/–/ʃ/"
      ],
      "fileBase": "MP_136",
      "files": {
        "female": "MP_136_female.mp3",
        "male": "MP_136_male.mp3"
      }
    },
    {
      "id": "137",
      "text": "sell",
      "groups": [
        "V04",
        "V08",
        "C06"
      ],
      "contrasts": [
        "/ɛ/–/ɪ/",
        "KK /e/–/ɛ/",
        "/s/–/ʃ/"
      ],
      "fileBase": "MP_137",
      "files": {
        "female": "MP_137_female.mp3",
        "male": "MP_137_male.mp3"
      }
    },
    {
      "id": "138",
      "text": "send",
      "groups": [
        "V02"
      ],
      "contrasts": [
        "/ɛ/–/æ/"
      ],
      "fileBase": "MP_138",
      "files": {
        "female": "MP_138_female.mp3",
        "male": "MP_138_male.mp3"
      }
    },
    {
      "id": "139",
      "text": "set",
      "groups": [
        "V02",
        "V04"
      ],
      "contrasts": [
        "/ɛ/–/æ/",
        "/ɛ/–/ɪ/"
      ],
      "fileBase": "MP_139",
      "files": {
        "female": "MP_139_female.mp3",
        "male": "MP_139_male.mp3"
      }
    },
    {
      "id": "140",
      "text": "share",
      "groups": [
        "C07"
      ],
      "contrasts": [
        "/tʃ/–/ʃ/"
      ],
      "fileBase": "MP_140",
      "files": {
        "female": "MP_140_female.mp3",
        "male": "MP_140_male.mp3"
      }
    },
    {
      "id": "141",
      "text": "she",
      "groups": [
        "C06"
      ],
      "contrasts": [
        "/s/–/ʃ/"
      ],
      "fileBase": "MP_141",
      "files": {
        "female": "MP_141_female.mp3",
        "male": "MP_141_male.mp3"
      }
    },
    {
      "id": "142",
      "text": "sheep",
      "groups": [
        "V01",
        "C07"
      ],
      "contrasts": [
        "/i/–/ɪ/",
        "/tʃ/–/ʃ/"
      ],
      "fileBase": "MP_142",
      "files": {
        "female": "MP_142_female.mp3",
        "male": "MP_142_male.mp3"
      }
    },
    {
      "id": "143",
      "text": "sheet",
      "groups": [
        "C06"
      ],
      "contrasts": [
        "/s/–/ʃ/"
      ],
      "fileBase": "MP_143",
      "files": {
        "female": "MP_143_female.mp3",
        "male": "MP_143_male.mp3"
      }
    },
    {
      "id": "144",
      "text": "shell",
      "groups": [
        "C06"
      ],
      "contrasts": [
        "/s/–/ʃ/"
      ],
      "fileBase": "MP_144",
      "files": {
        "female": "MP_144_female.mp3",
        "male": "MP_144_male.mp3"
      }
    },
    {
      "id": "145",
      "text": "shine",
      "groups": [
        "C06"
      ],
      "contrasts": [
        "/s/–/ʃ/"
      ],
      "fileBase": "MP_145",
      "files": {
        "female": "MP_145_female.mp3",
        "male": "MP_145_male.mp3"
      }
    },
    {
      "id": "146",
      "text": "ship",
      "groups": [
        "V01",
        "C06",
        "C07"
      ],
      "contrasts": [
        "/i/–/ɪ/",
        "/s/–/ʃ/",
        "/tʃ/–/ʃ/"
      ],
      "fileBase": "MP_146",
      "files": {
        "female": "MP_146_female.mp3",
        "male": "MP_146_male.mp3"
      }
    },
    {
      "id": "147",
      "text": "shock",
      "groups": [
        "C06"
      ],
      "contrasts": [
        "/s/–/ʃ/"
      ],
      "fileBase": "MP_147",
      "files": {
        "female": "MP_147_female.mp3",
        "male": "MP_147_male.mp3"
      }
    },
    {
      "id": "148",
      "text": "shoes",
      "groups": [
        "C07"
      ],
      "contrasts": [
        "/tʃ/–/ʃ/"
      ],
      "fileBase": "MP_148",
      "files": {
        "female": "MP_148_female.mp3",
        "male": "MP_148_male.mp3"
      }
    },
    {
      "id": "149",
      "text": "shop",
      "groups": [
        "C07"
      ],
      "contrasts": [
        "/tʃ/–/ʃ/"
      ],
      "fileBase": "MP_149",
      "files": {
        "female": "MP_149_female.mp3",
        "male": "MP_149_male.mp3"
      }
    },
    {
      "id": "150",
      "text": "short",
      "groups": [
        "C06"
      ],
      "contrasts": [
        "/s/–/ʃ/"
      ],
      "fileBase": "MP_150",
      "files": {
        "female": "MP_150_female.mp3",
        "male": "MP_150_male.mp3"
      }
    },
    {
      "id": "151",
      "text": "show",
      "groups": [
        "C06"
      ],
      "contrasts": [
        "/s/–/ʃ/"
      ],
      "fileBase": "MP_151",
      "files": {
        "female": "MP_151_female.mp3",
        "male": "MP_151_male.mp3"
      }
    },
    {
      "id": "152",
      "text": "shy",
      "groups": [
        "C06"
      ],
      "contrasts": [
        "/s/–/ʃ/"
      ],
      "fileBase": "MP_152",
      "files": {
        "female": "MP_152_female.mp3",
        "male": "MP_152_male.mp3"
      }
    },
    {
      "id": "153",
      "text": "sick",
      "groups": [
        "C02"
      ],
      "contrasts": [
        "/s/–/θ/"
      ],
      "fileBase": "MP_153",
      "files": {
        "female": "MP_153_female.mp3",
        "male": "MP_153_male.mp3"
      }
    },
    {
      "id": "154",
      "text": "sigh",
      "groups": [
        "C06"
      ],
      "contrasts": [
        "/s/–/ʃ/"
      ],
      "fileBase": "MP_154",
      "files": {
        "female": "MP_154_female.mp3",
        "male": "MP_154_male.mp3"
      }
    },
    {
      "id": "155",
      "text": "sign",
      "groups": [
        "C06"
      ],
      "contrasts": [
        "/s/–/ʃ/"
      ],
      "fileBase": "MP_155",
      "files": {
        "female": "MP_155_female.mp3",
        "male": "MP_155_male.mp3"
      }
    },
    {
      "id": "156",
      "text": "sill",
      "groups": [
        "V04"
      ],
      "contrasts": [
        "/ɛ/–/ɪ/"
      ],
      "fileBase": "MP_156",
      "files": {
        "female": "MP_156_female.mp3",
        "male": "MP_156_male.mp3"
      }
    },
    {
      "id": "157",
      "text": "sin",
      "groups": [
        "C08"
      ],
      "contrasts": [
        "/n/–/ŋ/"
      ],
      "fileBase": "MP_157",
      "files": {
        "female": "MP_157_female.mp3",
        "male": "MP_157_male.mp3"
      }
    },
    {
      "id": "158",
      "text": "sing",
      "groups": [
        "C02",
        "C08"
      ],
      "contrasts": [
        "/s/–/θ/",
        "/n/–/ŋ/"
      ],
      "fileBase": "MP_158",
      "files": {
        "female": "MP_158_female.mp3",
        "male": "MP_158_male.mp3"
      }
    },
    {
      "id": "159",
      "text": "sink",
      "groups": [
        "C02"
      ],
      "contrasts": [
        "/s/–/θ/"
      ],
      "fileBase": "MP_159",
      "files": {
        "female": "MP_159_female.mp3",
        "male": "MP_159_male.mp3"
      }
    },
    {
      "id": "160",
      "text": "sip",
      "groups": [
        "C06"
      ],
      "contrasts": [
        "/s/–/ʃ/"
      ],
      "fileBase": "MP_160",
      "files": {
        "female": "MP_160_female.mp3",
        "male": "MP_160_male.mp3"
      }
    },
    {
      "id": "161",
      "text": "sit",
      "groups": [
        "V01",
        "V04"
      ],
      "contrasts": [
        "/i/–/ɪ/",
        "/ɛ/–/ɪ/"
      ],
      "fileBase": "MP_161",
      "files": {
        "female": "MP_161_female.mp3",
        "male": "MP_161_male.mp3"
      }
    },
    {
      "id": "162",
      "text": "sleep",
      "groups": [
        "V01"
      ],
      "contrasts": [
        "/i/–/ɪ/"
      ],
      "fileBase": "MP_162",
      "files": {
        "female": "MP_162_female.mp3",
        "male": "MP_162_male.mp3"
      }
    },
    {
      "id": "163",
      "text": "slip",
      "groups": [
        "V01"
      ],
      "contrasts": [
        "/i/–/ɪ/"
      ],
      "fileBase": "MP_163",
      "files": {
        "female": "MP_163_female.mp3",
        "male": "MP_163_male.mp3"
      }
    },
    {
      "id": "164",
      "text": "so",
      "groups": [
        "C06"
      ],
      "contrasts": [
        "/s/–/ʃ/"
      ],
      "fileBase": "MP_164",
      "files": {
        "female": "MP_164_female.mp3",
        "male": "MP_164_male.mp3"
      }
    },
    {
      "id": "165",
      "text": "sock",
      "groups": [
        "C06"
      ],
      "contrasts": [
        "/s/–/ʃ/"
      ],
      "fileBase": "MP_165",
      "files": {
        "female": "MP_165_female.mp3",
        "male": "MP_165_male.mp3"
      }
    },
    {
      "id": "166",
      "text": "soot",
      "groups": [
        "V03"
      ],
      "contrasts": [
        "/u/–/ʊ/"
      ],
      "fileBase": "MP_166",
      "files": {
        "female": "MP_166_female.mp3",
        "male": "MP_166_male.mp3"
      }
    },
    {
      "id": "167",
      "text": "sort",
      "groups": [
        "C06"
      ],
      "contrasts": [
        "/s/–/ʃ/"
      ],
      "fileBase": "MP_167",
      "files": {
        "female": "MP_167_female.mp3",
        "male": "MP_167_male.mp3"
      }
    },
    {
      "id": "168",
      "text": "sought",
      "groups": [
        "C02"
      ],
      "contrasts": [
        "/s/–/θ/"
      ],
      "fileBase": "MP_168",
      "files": {
        "female": "MP_168_female.mp3",
        "male": "MP_168_male.mp3"
      }
    },
    {
      "id": "169",
      "text": "stalk",
      "groups": [
        "V06"
      ],
      "contrasts": [
        "/ɑ/–/ɔ/（延伸）"
      ],
      "fileBase": "MP_169",
      "files": {
        "female": "MP_169_female.mp3",
        "male": "MP_169_male.mp3"
      }
    },
    {
      "id": "170",
      "text": "stock",
      "groups": [
        "V06"
      ],
      "contrasts": [
        "/ɑ/–/ɔ/（延伸）"
      ],
      "fileBase": "MP_170",
      "files": {
        "female": "MP_170_female.mp3",
        "male": "MP_170_male.mp3"
      }
    },
    {
      "id": "171",
      "text": "suit",
      "groups": [
        "V03"
      ],
      "contrasts": [
        "/u/–/ʊ/"
      ],
      "fileBase": "MP_171",
      "files": {
        "female": "MP_171_female.mp3",
        "male": "MP_171_male.mp3"
      }
    },
    {
      "id": "172",
      "text": "sum",
      "groups": [
        "C02"
      ],
      "contrasts": [
        "/s/–/θ/"
      ],
      "fileBase": "MP_172",
      "files": {
        "female": "MP_172_female.mp3",
        "male": "MP_172_male.mp3"
      }
    },
    {
      "id": "173",
      "text": "sung",
      "groups": [
        "V05"
      ],
      "contrasts": [
        "/æ/–/ʌ/"
      ],
      "fileBase": "MP_173",
      "files": {
        "female": "MP_173_female.mp3",
        "male": "MP_173_male.mp3"
      }
    },
    {
      "id": "174",
      "text": "tan",
      "groups": [
        "V02"
      ],
      "contrasts": [
        "/ɛ/–/æ/"
      ],
      "fileBase": "MP_174",
      "files": {
        "female": "MP_174_female.mp3",
        "male": "MP_174_male.mp3"
      }
    },
    {
      "id": "175",
      "text": "taste",
      "groups": [
        "V08"
      ],
      "contrasts": [
        "KK /e/–/ɛ/"
      ],
      "fileBase": "MP_175",
      "files": {
        "female": "MP_175_female.mp3",
        "male": "MP_175_male.mp3"
      }
    },
    {
      "id": "176",
      "text": "ten",
      "groups": [
        "V02"
      ],
      "contrasts": [
        "/ɛ/–/æ/"
      ],
      "fileBase": "MP_176",
      "files": {
        "female": "MP_176_female.mp3",
        "male": "MP_176_male.mp3"
      }
    },
    {
      "id": "177",
      "text": "tense",
      "groups": [
        "C02"
      ],
      "contrasts": [
        "/s/–/θ/"
      ],
      "fileBase": "MP_177",
      "files": {
        "female": "MP_177_female.mp3",
        "male": "MP_177_male.mp3"
      }
    },
    {
      "id": "178",
      "text": "tenth",
      "groups": [
        "C02"
      ],
      "contrasts": [
        "/s/–/θ/"
      ],
      "fileBase": "MP_178",
      "files": {
        "female": "MP_178_female.mp3",
        "male": "MP_178_male.mp3"
      }
    },
    {
      "id": "179",
      "text": "test",
      "groups": [
        "V08"
      ],
      "contrasts": [
        "KK /e/–/ɛ/"
      ],
      "fileBase": "MP_179",
      "files": {
        "female": "MP_179_female.mp3",
        "male": "MP_179_male.mp3"
      }
    },
    {
      "id": "180",
      "text": "thank",
      "groups": [
        "C02"
      ],
      "contrasts": [
        "/s/–/θ/"
      ],
      "fileBase": "MP_180",
      "files": {
        "female": "MP_180_female.mp3",
        "male": "MP_180_male.mp3"
      }
    },
    {
      "id": "181",
      "text": "then",
      "groups": [
        "C03"
      ],
      "contrasts": [
        "/ð/–/d/"
      ],
      "fileBase": "MP_181",
      "files": {
        "female": "MP_181_female.mp3",
        "male": "MP_181_male.mp3"
      }
    },
    {
      "id": "182",
      "text": "there",
      "groups": [
        "C03"
      ],
      "contrasts": [
        "/ð/–/d/"
      ],
      "fileBase": "MP_182",
      "files": {
        "female": "MP_182_female.mp3",
        "male": "MP_182_male.mp3"
      }
    },
    {
      "id": "183",
      "text": "they",
      "groups": [
        "C03"
      ],
      "contrasts": [
        "/ð/–/d/"
      ],
      "fileBase": "MP_183",
      "files": {
        "female": "MP_183_female.mp3",
        "male": "MP_183_male.mp3"
      }
    },
    {
      "id": "184",
      "text": "thick",
      "groups": [
        "C02"
      ],
      "contrasts": [
        "/s/–/θ/"
      ],
      "fileBase": "MP_184",
      "files": {
        "female": "MP_184_female.mp3",
        "male": "MP_184_male.mp3"
      }
    },
    {
      "id": "185",
      "text": "thin",
      "groups": [
        "C08"
      ],
      "contrasts": [
        "/n/–/ŋ/"
      ],
      "fileBase": "MP_185",
      "files": {
        "female": "MP_185_female.mp3",
        "male": "MP_185_male.mp3"
      }
    },
    {
      "id": "186",
      "text": "thing",
      "groups": [
        "C02",
        "C08"
      ],
      "contrasts": [
        "/s/–/θ/",
        "/n/–/ŋ/"
      ],
      "fileBase": "MP_186",
      "files": {
        "female": "MP_186_female.mp3",
        "male": "MP_186_male.mp3"
      }
    },
    {
      "id": "187",
      "text": "think",
      "groups": [
        "C02"
      ],
      "contrasts": [
        "/s/–/θ/"
      ],
      "fileBase": "MP_187",
      "files": {
        "female": "MP_187_female.mp3",
        "male": "MP_187_male.mp3"
      }
    },
    {
      "id": "188",
      "text": "those",
      "groups": [
        "C03"
      ],
      "contrasts": [
        "/ð/–/d/"
      ],
      "fileBase": "MP_188",
      "files": {
        "female": "MP_188_female.mp3",
        "male": "MP_188_male.mp3"
      }
    },
    {
      "id": "189",
      "text": "though",
      "groups": [
        "C03"
      ],
      "contrasts": [
        "/ð/–/d/"
      ],
      "fileBase": "MP_189",
      "files": {
        "female": "MP_189_female.mp3",
        "male": "MP_189_male.mp3"
      }
    },
    {
      "id": "190",
      "text": "thought",
      "groups": [
        "C02"
      ],
      "contrasts": [
        "/s/–/θ/"
      ],
      "fileBase": "MP_190",
      "files": {
        "female": "MP_190_female.mp3",
        "male": "MP_190_male.mp3"
      }
    },
    {
      "id": "191",
      "text": "thumb",
      "groups": [
        "C02"
      ],
      "contrasts": [
        "/s/–/θ/"
      ],
      "fileBase": "MP_191",
      "files": {
        "female": "MP_191_female.mp3",
        "male": "MP_191_male.mp3"
      }
    },
    {
      "id": "192",
      "text": "took",
      "groups": [
        "V07"
      ],
      "contrasts": [
        "/ʊ/–/ʌ/"
      ],
      "fileBase": "MP_192",
      "files": {
        "female": "MP_192_female.mp3",
        "male": "MP_192_male.mp3"
      }
    },
    {
      "id": "193",
      "text": "tuck",
      "groups": [
        "V07"
      ],
      "contrasts": [
        "/ʊ/–/ʌ/"
      ],
      "fileBase": "MP_193",
      "files": {
        "female": "MP_193_female.mp3",
        "male": "MP_193_male.mp3"
      }
    },
    {
      "id": "194",
      "text": "uncle",
      "groups": [
        "V05"
      ],
      "contrasts": [
        "/æ/–/ʌ/"
      ],
      "fileBase": "MP_194",
      "files": {
        "female": "MP_194_female.mp3",
        "male": "MP_194_male.mp3"
      }
    },
    {
      "id": "195",
      "text": "van",
      "groups": [
        "C05"
      ],
      "contrasts": [
        "/b/–/v/"
      ],
      "fileBase": "MP_195",
      "files": {
        "female": "MP_195_female.mp3",
        "male": "MP_195_male.mp3"
      }
    },
    {
      "id": "196",
      "text": "vat",
      "groups": [
        "C05"
      ],
      "contrasts": [
        "/b/–/v/"
      ],
      "fileBase": "MP_196",
      "files": {
        "female": "MP_196_female.mp3",
        "male": "MP_196_male.mp3"
      }
    },
    {
      "id": "197",
      "text": "veil",
      "groups": [
        "C04"
      ],
      "contrasts": [
        "/v/–/w/"
      ],
      "fileBase": "MP_197",
      "files": {
        "female": "MP_197_female.mp3",
        "male": "MP_197_male.mp3"
      }
    },
    {
      "id": "198",
      "text": "verse",
      "groups": [
        "C04"
      ],
      "contrasts": [
        "/v/–/w/"
      ],
      "fileBase": "MP_198",
      "files": {
        "female": "MP_198_female.mp3",
        "male": "MP_198_male.mp3"
      }
    },
    {
      "id": "199",
      "text": "very",
      "groups": [
        "C05"
      ],
      "contrasts": [
        "/b/–/v/"
      ],
      "fileBase": "MP_199",
      "files": {
        "female": "MP_199_female.mp3",
        "male": "MP_199_male.mp3"
      }
    },
    {
      "id": "200",
      "text": "vest",
      "groups": [
        "C04",
        "C05"
      ],
      "contrasts": [
        "/v/–/w/",
        "/b/–/v/"
      ],
      "fileBase": "MP_200",
      "files": {
        "female": "MP_200_female.mp3",
        "male": "MP_200_male.mp3"
      }
    },
    {
      "id": "201",
      "text": "vet",
      "groups": [
        "C04"
      ],
      "contrasts": [
        "/v/–/w/"
      ],
      "fileBase": "MP_201",
      "files": {
        "female": "MP_201_female.mp3",
        "male": "MP_201_male.mp3"
      }
    },
    {
      "id": "202",
      "text": "vine",
      "groups": [
        "C04"
      ],
      "contrasts": [
        "/v/–/w/"
      ],
      "fileBase": "MP_202",
      "files": {
        "female": "MP_202_female.mp3",
        "male": "MP_202_male.mp3"
      }
    },
    {
      "id": "203",
      "text": "vote",
      "groups": [
        "C05"
      ],
      "contrasts": [
        "/b/–/v/"
      ],
      "fileBase": "MP_203",
      "files": {
        "female": "MP_203_female.mp3",
        "male": "MP_203_male.mp3"
      }
    },
    {
      "id": "204",
      "text": "wait",
      "groups": [
        "V08"
      ],
      "contrasts": [
        "KK /e/–/ɛ/"
      ],
      "fileBase": "MP_204",
      "files": {
        "female": "MP_204_female.mp3",
        "male": "MP_204_male.mp3"
      }
    },
    {
      "id": "205",
      "text": "west",
      "groups": [
        "C04"
      ],
      "contrasts": [
        "/v/–/w/"
      ],
      "fileBase": "MP_205",
      "files": {
        "female": "MP_205_female.mp3",
        "male": "MP_205_male.mp3"
      }
    },
    {
      "id": "206",
      "text": "wet",
      "groups": [
        "V08",
        "C04"
      ],
      "contrasts": [
        "KK /e/–/ɛ/",
        "/v/–/w/"
      ],
      "fileBase": "MP_206",
      "files": {
        "female": "MP_206_female.mp3",
        "male": "MP_206_male.mp3"
      }
    },
    {
      "id": "207",
      "text": "whale",
      "groups": [
        "C04"
      ],
      "contrasts": [
        "/v/–/w/"
      ],
      "fileBase": "MP_207",
      "files": {
        "female": "MP_207_female.mp3",
        "male": "MP_207_male.mp3"
      }
    },
    {
      "id": "208",
      "text": "win",
      "groups": [
        "C08"
      ],
      "contrasts": [
        "/n/–/ŋ/"
      ],
      "fileBase": "MP_208",
      "files": {
        "female": "MP_208_female.mp3",
        "male": "MP_208_male.mp3"
      }
    },
    {
      "id": "209",
      "text": "wine",
      "groups": [
        "C04"
      ],
      "contrasts": [
        "/v/–/w/"
      ],
      "fileBase": "MP_209",
      "files": {
        "female": "MP_209_female.mp3",
        "male": "MP_209_male.mp3"
      }
    },
    {
      "id": "210",
      "text": "wing",
      "groups": [
        "C08"
      ],
      "contrasts": [
        "/n/–/ŋ/"
      ],
      "fileBase": "MP_210",
      "files": {
        "female": "MP_210_female.mp3",
        "male": "MP_210_male.mp3"
      }
    },
    {
      "id": "211",
      "text": "worse",
      "groups": [
        "C04"
      ],
      "contrasts": [
        "/v/–/w/"
      ],
      "fileBase": "MP_211",
      "files": {
        "female": "MP_211_female.mp3",
        "male": "MP_211_male.mp3"
      }
    },
    {
      "id": "212",
      "text": "wrong",
      "groups": [
        "C01"
      ],
      "contrasts": [
        "/l/–/r/"
      ],
      "fileBase": "MP_212",
      "files": {
        "female": "MP_212_female.mp3",
        "male": "MP_212_male.mp3"
      }
    }
  ],
  "files": {
    "female": [
      "MP_001_female.mp3",
      "MP_002_female.mp3",
      "MP_003_female.mp3",
      "MP_004_female.mp3",
      "MP_005_female.mp3",
      "MP_006_female.mp3",
      "MP_007_female.mp3",
      "MP_008_female.mp3",
      "MP_009_female.mp3",
      "MP_010_female.mp3",
      "MP_011_female.mp3",
      "MP_012_female.mp3",
      "MP_013_female.mp3",
      "MP_014_female.mp3",
      "MP_015_female.mp3",
      "MP_016_female.mp3",
      "MP_017_female.mp3",
      "MP_018_female.mp3",
      "MP_019_female.mp3",
      "MP_020_female.mp3",
      "MP_021_female.mp3",
      "MP_022_female.mp3",
      "MP_023_female.mp3",
      "MP_024_female.mp3",
      "MP_025_female.mp3",
      "MP_026_female.mp3",
      "MP_027_female.mp3",
      "MP_028_female.mp3",
      "MP_029_female.mp3",
      "MP_030_female.mp3",
      "MP_031_female.mp3",
      "MP_032_female.mp3",
      "MP_033_female.mp3",
      "MP_034_female.mp3",
      "MP_035_female.mp3",
      "MP_036_female.mp3",
      "MP_037_female.mp3",
      "MP_038_female.mp3",
      "MP_039_female.mp3",
      "MP_040_female.mp3",
      "MP_041_female.mp3",
      "MP_042_female.mp3",
      "MP_043_female.mp3",
      "MP_044_female.mp3",
      "MP_045_female.mp3",
      "MP_046_female.mp3",
      "MP_047_female.mp3",
      "MP_048_female.mp3",
      "MP_049_female.mp3",
      "MP_050_female.mp3",
      "MP_051_female.mp3",
      "MP_052_female.mp3",
      "MP_053_female.mp3",
      "MP_054_female.mp3",
      "MP_055_female.mp3",
      "MP_056_female.mp3",
      "MP_057_female.mp3",
      "MP_058_female.mp3",
      "MP_059_female.mp3",
      "MP_060_female.mp3",
      "MP_061_female.mp3",
      "MP_062_female.mp3",
      "MP_063_female.mp3",
      "MP_064_female.mp3",
      "MP_065_female.mp3",
      "MP_066_female.mp3",
      "MP_067_female.mp3",
      "MP_068_female.mp3",
      "MP_069_female.mp3",
      "MP_070_female.mp3",
      "MP_071_female.mp3",
      "MP_072_female.mp3",
      "MP_073_female.mp3",
      "MP_074_female.mp3",
      "MP_075_female.mp3",
      "MP_076_female.mp3",
      "MP_077_female.mp3",
      "MP_078_female.mp3",
      "MP_079_female.mp3",
      "MP_080_female.mp3",
      "MP_081_female.mp3",
      "MP_082_female.mp3",
      "MP_083_female.mp3",
      "MP_084_female.mp3",
      "MP_085_female.mp3",
      "MP_086_female.mp3",
      "MP_087_female.mp3",
      "MP_088_female.mp3",
      "MP_089_female.mp3",
      "MP_090_female.mp3",
      "MP_091_female.mp3",
      "MP_092_female.mp3",
      "MP_093_female.mp3",
      "MP_094_female.mp3",
      "MP_095_female.mp3",
      "MP_096_female.mp3",
      "MP_097_female.mp3",
      "MP_098_female.mp3",
      "MP_099_female.mp3",
      "MP_100_female.mp3",
      "MP_101_female.mp3",
      "MP_102_female.mp3",
      "MP_103_female.mp3",
      "MP_104_female.mp3",
      "MP_105_female.mp3",
      "MP_106_female.mp3",
      "MP_107_female.mp3",
      "MP_108_female.mp3",
      "MP_109_female.mp3",
      "MP_110_female.mp3",
      "MP_111_female.mp3",
      "MP_112_female.mp3",
      "MP_113_female.mp3",
      "MP_114_female.mp3",
      "MP_115_female.mp3",
      "MP_116_female.mp3",
      "MP_117_female.mp3",
      "MP_118_female.mp3",
      "MP_119_female.mp3",
      "MP_120_female.mp3",
      "MP_121_female.mp3",
      "MP_122_female.mp3",
      "MP_123_female.mp3",
      "MP_124_female.mp3",
      "MP_125_female.mp3",
      "MP_126_female.mp3",
      "MP_127_female.mp3",
      "MP_128_female.mp3",
      "MP_129_female.mp3",
      "MP_130_female.mp3",
      "MP_131_female.mp3",
      "MP_132_female.mp3",
      "MP_133_female.mp3",
      "MP_134_female.mp3",
      "MP_135_female.mp3",
      "MP_136_female.mp3",
      "MP_137_female.mp3",
      "MP_138_female.mp3",
      "MP_139_female.mp3",
      "MP_140_female.mp3",
      "MP_141_female.mp3",
      "MP_142_female.mp3",
      "MP_143_female.mp3",
      "MP_144_female.mp3",
      "MP_145_female.mp3",
      "MP_146_female.mp3",
      "MP_147_female.mp3",
      "MP_148_female.mp3",
      "MP_149_female.mp3",
      "MP_150_female.mp3",
      "MP_151_female.mp3",
      "MP_152_female.mp3",
      "MP_153_female.mp3",
      "MP_154_female.mp3",
      "MP_155_female.mp3",
      "MP_156_female.mp3",
      "MP_157_female.mp3",
      "MP_158_female.mp3",
      "MP_159_female.mp3",
      "MP_160_female.mp3",
      "MP_161_female.mp3",
      "MP_162_female.mp3",
      "MP_163_female.mp3",
      "MP_164_female.mp3",
      "MP_165_female.mp3",
      "MP_166_female.mp3",
      "MP_167_female.mp3",
      "MP_168_female.mp3",
      "MP_169_female.mp3",
      "MP_170_female.mp3",
      "MP_171_female.mp3",
      "MP_172_female.mp3",
      "MP_173_female.mp3",
      "MP_174_female.mp3",
      "MP_175_female.mp3",
      "MP_176_female.mp3",
      "MP_177_female.mp3",
      "MP_178_female.mp3",
      "MP_179_female.mp3",
      "MP_180_female.mp3",
      "MP_181_female.mp3",
      "MP_182_female.mp3",
      "MP_183_female.mp3",
      "MP_184_female.mp3",
      "MP_185_female.mp3",
      "MP_186_female.mp3",
      "MP_187_female.mp3",
      "MP_188_female.mp3",
      "MP_189_female.mp3",
      "MP_190_female.mp3",
      "MP_191_female.mp3",
      "MP_192_female.mp3",
      "MP_193_female.mp3",
      "MP_194_female.mp3",
      "MP_195_female.mp3",
      "MP_196_female.mp3",
      "MP_197_female.mp3",
      "MP_198_female.mp3",
      "MP_199_female.mp3",
      "MP_200_female.mp3",
      "MP_201_female.mp3",
      "MP_202_female.mp3",
      "MP_203_female.mp3",
      "MP_204_female.mp3",
      "MP_205_female.mp3",
      "MP_206_female.mp3",
      "MP_207_female.mp3",
      "MP_208_female.mp3",
      "MP_209_female.mp3",
      "MP_210_female.mp3",
      "MP_211_female.mp3",
      "MP_212_female.mp3"
    ],
    "male": [
      "MP_001_male.mp3",
      "MP_002_male.mp3",
      "MP_003_male.mp3",
      "MP_004_male.mp3",
      "MP_005_male.mp3",
      "MP_006_male.mp3",
      "MP_007_male.mp3",
      "MP_008_male.mp3",
      "MP_009_male.mp3",
      "MP_010_male.mp3",
      "MP_011_male.mp3",
      "MP_012_male.mp3",
      "MP_013_male.mp3",
      "MP_014_male.mp3",
      "MP_015_male.mp3",
      "MP_016_male.mp3",
      "MP_017_male.mp3",
      "MP_018_male.mp3",
      "MP_019_male.mp3",
      "MP_020_male.mp3",
      "MP_021_male.mp3",
      "MP_022_male.mp3",
      "MP_023_male.mp3",
      "MP_024_male.mp3",
      "MP_025_male.mp3",
      "MP_026_male.mp3",
      "MP_027_male.mp3",
      "MP_028_male.mp3",
      "MP_029_male.mp3",
      "MP_030_male.mp3",
      "MP_031_male.mp3",
      "MP_032_male.mp3",
      "MP_033_male.mp3",
      "MP_034_male.mp3",
      "MP_035_male.mp3",
      "MP_036_male.mp3",
      "MP_037_male.mp3",
      "MP_038_male.mp3",
      "MP_039_male.mp3",
      "MP_040_male.mp3",
      "MP_041_male.mp3",
      "MP_042_male.mp3",
      "MP_043_male.mp3",
      "MP_044_male.mp3",
      "MP_045_male.mp3",
      "MP_046_male.mp3",
      "MP_047_male.mp3",
      "MP_048_male.mp3",
      "MP_049_male.mp3",
      "MP_050_male.mp3",
      "MP_051_male.mp3",
      "MP_052_male.mp3",
      "MP_053_male.mp3",
      "MP_054_male.mp3",
      "MP_055_male.mp3",
      "MP_056_male.mp3",
      "MP_057_male.mp3",
      "MP_058_male.mp3",
      "MP_059_male.mp3",
      "MP_060_male.mp3",
      "MP_061_male.mp3",
      "MP_062_male.mp3",
      "MP_063_male.mp3",
      "MP_064_male.mp3",
      "MP_065_male.mp3",
      "MP_066_male.mp3",
      "MP_067_male.mp3",
      "MP_068_male.mp3",
      "MP_069_male.mp3",
      "MP_070_male.mp3",
      "MP_071_male.mp3",
      "MP_072_male.mp3",
      "MP_073_male.mp3",
      "MP_074_male.mp3",
      "MP_075_male.mp3",
      "MP_076_male.mp3",
      "MP_077_male.mp3",
      "MP_078_male.mp3",
      "MP_079_male.mp3",
      "MP_080_male.mp3",
      "MP_081_male.mp3",
      "MP_082_male.mp3",
      "MP_083_male.mp3",
      "MP_084_male.mp3",
      "MP_085_male.mp3",
      "MP_086_male.mp3",
      "MP_087_male.mp3",
      "MP_088_male.mp3",
      "MP_089_male.mp3",
      "MP_090_male.mp3",
      "MP_091_male.mp3",
      "MP_092_male.mp3",
      "MP_093_male.mp3",
      "MP_094_male.mp3",
      "MP_095_male.mp3",
      "MP_096_male.mp3",
      "MP_097_male.mp3",
      "MP_098_male.mp3",
      "MP_099_male.mp3",
      "MP_100_male.mp3",
      "MP_101_male.mp3",
      "MP_102_male.mp3",
      "MP_103_male.mp3",
      "MP_104_male.mp3",
      "MP_105_male.mp3",
      "MP_106_male.mp3",
      "MP_107_male.mp3",
      "MP_108_male.mp3",
      "MP_109_male.mp3",
      "MP_110_male.mp3",
      "MP_111_male.mp3",
      "MP_112_male.mp3",
      "MP_113_male.mp3",
      "MP_114_male.mp3",
      "MP_115_male.mp3",
      "MP_116_male.mp3",
      "MP_117_male.mp3",
      "MP_118_male.mp3",
      "MP_119_male.mp3",
      "MP_120_male.mp3",
      "MP_121_male.mp3",
      "MP_122_male.mp3",
      "MP_123_male.mp3",
      "MP_124_male.mp3",
      "MP_125_male.mp3",
      "MP_126_male.mp3",
      "MP_127_male.mp3",
      "MP_128_male.mp3",
      "MP_129_male.mp3",
      "MP_130_male.mp3",
      "MP_131_male.mp3",
      "MP_132_male.mp3",
      "MP_133_male.mp3",
      "MP_134_male.mp3",
      "MP_135_male.mp3",
      "MP_136_male.mp3",
      "MP_137_male.mp3",
      "MP_138_male.mp3",
      "MP_139_male.mp3",
      "MP_140_male.mp3",
      "MP_141_male.mp3",
      "MP_142_male.mp3",
      "MP_143_male.mp3",
      "MP_144_male.mp3",
      "MP_145_male.mp3",
      "MP_146_male.mp3",
      "MP_147_male.mp3",
      "MP_148_male.mp3",
      "MP_149_male.mp3",
      "MP_150_male.mp3",
      "MP_151_male.mp3",
      "MP_152_male.mp3",
      "MP_153_male.mp3",
      "MP_154_male.mp3",
      "MP_155_male.mp3",
      "MP_156_male.mp3",
      "MP_157_male.mp3",
      "MP_158_male.mp3",
      "MP_159_male.mp3",
      "MP_160_male.mp3",
      "MP_161_male.mp3",
      "MP_162_male.mp3",
      "MP_163_male.mp3",
      "MP_164_male.mp3",
      "MP_165_male.mp3",
      "MP_166_male.mp3",
      "MP_167_male.mp3",
      "MP_168_male.mp3",
      "MP_169_male.mp3",
      "MP_170_male.mp3",
      "MP_171_male.mp3",
      "MP_172_male.mp3",
      "MP_173_male.mp3",
      "MP_174_male.mp3",
      "MP_175_male.mp3",
      "MP_176_male.mp3",
      "MP_177_male.mp3",
      "MP_178_male.mp3",
      "MP_179_male.mp3",
      "MP_180_male.mp3",
      "MP_181_male.mp3",
      "MP_182_male.mp3",
      "MP_183_male.mp3",
      "MP_184_male.mp3",
      "MP_185_male.mp3",
      "MP_186_male.mp3",
      "MP_187_male.mp3",
      "MP_188_male.mp3",
      "MP_189_male.mp3",
      "MP_190_male.mp3",
      "MP_191_male.mp3",
      "MP_192_male.mp3",
      "MP_193_male.mp3",
      "MP_194_male.mp3",
      "MP_195_male.mp3",
      "MP_196_male.mp3",
      "MP_197_male.mp3",
      "MP_198_male.mp3",
      "MP_199_male.mp3",
      "MP_200_male.mp3",
      "MP_201_male.mp3",
      "MP_202_male.mp3",
      "MP_203_male.mp3",
      "MP_204_male.mp3",
      "MP_205_male.mp3",
      "MP_206_male.mp3",
      "MP_207_male.mp3",
      "MP_208_male.mp3",
      "MP_209_male.mp3",
      "MP_210_male.mp3",
      "MP_211_male.mp3",
      "MP_212_male.mp3"
    ]
  }
};
})(window);
