import { ReadAlong, SupportedLanguage } from "../app/ras.service";

export const LANGS_MOCK: Array<SupportedLanguage> = [
  {
    code: "alq",
    names: {
      _: "Algonquin",
    },
  },
  {
    code: "atj",
    names: {
      _: "Atikamekw",
    },
  },
  {
    code: "ckt",
    names: {
      _: "Chukchi",
    },
  },
  {
    code: "crg-dv",
    names: {
      _: "Michif",
    },
  },
  {
    code: "crg-tmd",
    names: {
      _: "Michif",
    },
  },
  {
    code: "crj",
    names: {
      _: "Southern East Cree",
    },
  },
  {
    code: "crk",
    names: {
      _: "Plains Cree",
    },
  },
  {
    code: "crl",
    names: {
      _: "Northern East Cree",
    },
  },
  {
    code: "crm",
    names: {
      _: "Moose Cree",
    },
  },
  {
    code: "csw",
    names: {
      _: "Swampy Cree",
    },
  },
  {
    code: "ctp",
    names: {
      _: "Western Highland Chatino",
    },
  },
  {
    code: "dan",
    names: {
      _: "Danish",
    },
  },
  {
    code: "eng",
    names: {
      _: "English",
    },
  },
  {
    code: "fin",
    names: {
      _: "Finnish",
    },
  },
  {
    code: "fra",
    names: {
      _: "French",
    },
  },
  {
    code: "git",
    names: {
      _: "Gitksan",
    },
  },
  {
    code: "gla",
    names: {
      _: "Scottish Gaelic",
    },
  },
  {
    code: "gwi",
    names: {
      _: "Gwich'in",
    },
  },
  {
    code: "haa",
    names: {
      _: "Hän",
    },
  },
  {
    code: "ikt",
    names: {
      _: "Western Inuktut",
    },
  },
  {
    code: "iku",
    names: {
      _: "Inuktitut",
    },
  },
  {
    code: "iku-sro",
    names: {
      _: "Inuktitut",
    },
  },
  {
    code: "kkz",
    names: {
      _: "Kaska",
    },
  },
  {
    code: "kwk-boas",
    names: {
      _: "Kwak'wala",
    },
  },
  {
    code: "kwk-napa",
    names: {
      _: "Kwak'wala",
    },
  },
  {
    code: "kwk-umista",
    names: {
      _: "Kwak'wala",
    },
  },
  {
    code: "lml",
    names: {
      _: "Raga",
    },
  },
  {
    code: "mic",
    names: {
      _: "Mi'kmaq",
    },
  },
  {
    code: "moe",
    names: {
      _: "Innu-aimun",
    },
  },
  {
    code: "moh",
    names: {
      _: "Mohawk",
    },
  },
  {
    code: "oji",
    names: {
      _: "Ojibwe",
    },
  },
  {
    code: "oji-syl",
    names: {
      _: "Ojibwe",
    },
  },
  {
    code: "see",
    names: {
      _: "Seneca",
    },
  },
  {
    code: "srs",
    names: {
      _: "Tsuut'ina",
    },
  },
  {
    code: "str",
    names: {
      _: "SENĆOŦEN",
    },
  },
  {
    code: "tau",
    names: {
      _: "Upper Tanana",
    },
  },
  {
    code: "tce",
    names: {
      _: "Southern Tutchone",
    },
  },
  {
    code: "tgx",
    names: {
      _: "Tagish",
    },
  },
  {
    code: "tli",
    names: {
      _: "Tlingit",
    },
  },
  {
    code: "ttm",
    names: {
      _: "Northern Tutchone",
    },
  },
  {
    code: "und",
    names: {
      _: "Undetermined",
    },
  },
  {
    code: "win",
    names: {
      _: "Hoocąk",
    },
  },
];

export const ASSEMBLE_MOCK: ReadAlong = {
  lexicon: [
    ["t0b0d0p0s0w0", "HH EH Y"],
    ["t0b0d0p0s0w1", "V Y D EH N"],
  ],
  text_ids: "t0b0d0p0s0w0 t0b0d0p0s0w1",
  processed_ras:
    '<read-along>\n    <text xml:lang="dan" fallback-langs="und" id="t0">\n        <body id="t0b0">\n            <div type="page" id="t0b0d0">\n                <p id="t0b0d0p0">\n                    <s id="t0b0d0p0s0"><w id="t0b0d0p0s0w0" ARPABET="HH EH Y">hej</w> <w id="t0b0d0p0s0w1" ARPABET="V Y D EH N">verden</w></s>\n                </p>\n            </div>\n        </body>\n    </text>\n</read-along>',
  input: null,
  parsed: null,
  tokenized: null,
  g2ped: null,
};
