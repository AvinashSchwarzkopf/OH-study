// GENERATED FILE - do not edit by hand.
// Source: OH Study design - Current version.csv
// Regenerate with: python3 build_patterns.py
const PATTERNS = [
  {
    "id": "identity",
    "group": "Identity",
    "name": "Identity",
    "bags": [
      "AAAAA",
      "BBBBB",
      "CCCCC",
      "DDDDD"
    ],
    "valid": true,
    "note": "",
    "n_evidence_bag1": 4,
    "n_critical_later": 4,
    "n_elements_in_pred": 1
  },
  {
    "id": "identity_random",
    "group": "Identity",
    "name": "Identity / Random",
    "bags": [
      "CCCCCC",
      "CBADBBAD",
      "CCCCCC",
      "DCABDBAD"
    ],
    "valid": true,
    "note": "",
    "n_evidence_bag1": null,
    "n_critical_later": null,
    "n_elements_in_pred": null
  },
  {
    "id": "random_identity",
    "group": "Identity",
    "name": "Random / Identity",
    "bags": [
      "ABDCBAD",
      "CCCCCC",
      "CBDABCD",
      "CCCCCC"
    ],
    "valid": true,
    "note": "",
    "n_evidence_bag1": null,
    "n_critical_later": null,
    "n_elements_in_pred": null
  },
  {
    "id": "identity_front_half",
    "group": "Identity",
    "name": "Identity (front half)",
    "bags": [
      "AAAABCAD",
      "BBBBACBD",
      "CCCCADCB",
      "DDDDCADB"
    ],
    "valid": true,
    "note": "",
    "n_evidence_bag1": null,
    "n_critical_later": null,
    "n_elements_in_pred": null
  },
  {
    "id": "identity_back_half",
    "group": "Identity",
    "name": "Identity (back half)",
    "bags": [
      "BCADAAAA",
      "ACBDBBBB",
      "CADBCCCC",
      "CADBDDDD"
    ],
    "valid": true,
    "note": "",
    "n_evidence_bag1": null,
    "n_critical_later": null,
    "n_elements_in_pred": null
  },
  {
    "id": "alternating",
    "group": "Pair Relation",
    "name": "Alternating",
    "bags": [
      "ABABAB",
      "CDCDCD",
      "ADADAD",
      "BCBCBC"
    ],
    "valid": true,
    "note": "",
    "n_evidence_bag1": 2,
    "n_critical_later": 4,
    "n_elements_in_pred": 2
  },
  {
    "id": "alternating_random",
    "group": "Pair Relation",
    "name": "Alternating / Random",
    "bags": [
      "ABABABAB",
      "ABCDCBDA",
      "CDCDCDCD",
      "BACBDCDD"
    ],
    "valid": true,
    "note": "",
    "n_evidence_bag1": null,
    "n_critical_later": null,
    "n_elements_in_pred": null
  },
  {
    "id": "doubles",
    "group": "Pair Relation",
    "name": "Doubles",
    "bags": [
      "AADDCCAA",
      "DDCCAABB",
      "CCDDBBDD",
      "DDAADDBB"
    ],
    "valid": true,
    "note": "",
    "n_evidence_bag1": 3,
    "n_critical_later": 4,
    "n_elements_in_pred": null
  },
  {
    "id": "hitch",
    "group": "Pair Relation",
    "name": "Hitch",
    "bags": [
      "ABCBDBABDB",
      "CDCDBDADBD",
      "DACACABACA",
      "BCDCACACBC"
    ],
    "valid": true,
    "note": "",
    "n_evidence_bag1": 4,
    "n_critical_later": 4,
    "n_elements_in_pred": 1
  },
  {
    "id": "triples_split",
    "group": "Triplet Relation",
    "name": "Triples (Split)",
    "bags": [
      "AAABBB",
      "DDDCCC",
      "DDDAAA",
      "CCCBBB"
    ],
    "valid": true,
    "note": "",
    "n_evidence_bag1": 2,
    "n_critical_later": 4,
    "n_elements_in_pred": 2
  },
  {
    "id": "triplets_121",
    "group": "Triplet Relation",
    "name": "Triplets (121)",
    "bags": [
      "ABAABAABA",
      "CDCCDCCDC",
      "DCDDCDDCD",
      "BDBBDBBDB"
    ],
    "valid": true,
    "note": "",
    "n_evidence_bag1": 2,
    "n_critical_later": 6,
    "n_elements_in_pred": null
  },
  {
    "id": "triplets_122",
    "group": "Triplet Relation",
    "name": "Triplets (122)",
    "bags": [
      "ABBABBABB",
      "BDDBDDBDD",
      "CAACAACAA",
      "DBBDBBDBB"
    ],
    "valid": true,
    "note": "",
    "n_evidence_bag1": null,
    "n_critical_later": null,
    "n_elements_in_pred": null
  },
  {
    "id": "triplets_123",
    "group": "Triplet Relation",
    "name": "Triplets (123)",
    "bags": [
      "ABDABDABD",
      "CDACDACDA",
      "BDCBDCBDC",
      "BADBADBAD"
    ],
    "valid": true,
    "note": "",
    "n_evidence_bag1": 2,
    "n_critical_later": 6,
    "n_elements_in_pred": null
  },
  {
    "id": "triplets_1_2",
    "group": "Triplet Relation",
    "name": "Triplets (1?2)",
    "bags": [
      "ABDACDADD",
      "CADCBDCCD",
      "BADBCDBCD",
      "BDABAABCA"
    ],
    "valid": true,
    "note": "",
    "n_evidence_bag1": null,
    "n_critical_later": null,
    "n_elements_in_pred": null
  },
  {
    "id": "triplets_122_everythird",
    "group": "Triplet Relation",
    "name": "Triplets (122-EveryThird)",
    "bags": [
      "ABBADDACC",
      "CDDCAACCC",
      "DBBDAADDD",
      "ACCADDAAA"
    ],
    "valid": true,
    "note": "",
    "n_evidence_bag1": null,
    "n_critical_later": null,
    "n_elements_in_pred": null
  },
  {
    "id": "triplets_everythird",
    "group": "Triplet Relation",
    "name": "Triplets (EveryThird)",
    "bags": [
      "ACDADBA",
      "CABCBDC",
      "BADBDCB",
      "DADDBCD"
    ],
    "valid": true,
    "note": "",
    "n_evidence_bag1": null,
    "n_critical_later": null,
    "n_elements_in_pred": null
  },
  {
    "id": "grow",
    "group": "Grow",
    "name": "Grow",
    "bags": [
      "ABBCCC",
      "BDDAAA",
      "CAADDD",
      "DCCBBB"
    ],
    "valid": true,
    "note": "",
    "n_evidence_bag1": 2,
    "n_critical_later": 3,
    "n_elements_in_pred": 2
  },
  {
    "id": "grow_one_letter",
    "group": "Grow",
    "name": "Grow (one letter)",
    "bags": [
      "ABABABAB",
      "ABBABBABB",
      "ABBBABBB",
      "ABBBBABBBB"
    ],
    "valid": true,
    "note": "",
    "n_evidence_bag1": null,
    "n_critical_later": null,
    "n_elements_in_pred": null
  },
  {
    "id": "grow_pair",
    "group": "Grow",
    "name": "Grow (pair)",
    "bags": [
      "ABABABAB",
      "AABBAABBAA",
      "AAABBBAAA",
      "AAAABBBB"
    ],
    "valid": true,
    "note": "",
    "n_evidence_bag1": null,
    "n_critical_later": null,
    "n_elements_in_pred": null
  },
  {
    "id": "abcd_w_random_repeats",
    "group": "Holistic",
    "name": "ABCD w/ random repeats",
    "bags": [
      "AABCCDDD",
      "AAABBCDD",
      "ABCCCCDD",
      "AABBBBCD"
    ],
    "valid": true,
    "note": "",
    "n_evidence_bag1": null,
    "n_critical_later": null,
    "n_elements_in_pred": null
  },
  {
    "id": "symmetry",
    "group": "Holistic",
    "name": "Symmetry",
    "bags": [
      "AABBBBAA",
      "CBDDDDBC",
      "ABCDDCBA",
      "AABCCBAA"
    ],
    "valid": true,
    "note": "",
    "n_evidence_bag1": 1,
    "n_critical_later": 4,
    "n_elements_in_pred": 3
  },
  {
    "id": "bracketing",
    "group": "Holistic",
    "name": "Bracketing",
    "bags": [
      "AACBDBCA",
      "BABCDBAB",
      "CABDCBDC",
      "DANCDNCD"
    ],
    "valid": false,
    "note": "",
    "n_evidence_bag1": null,
    "n_critical_later": null,
    "n_elements_in_pred": null
  },
  {
    "id": "random",
    "group": "Random",
    "name": "Random",
    "bags": [
      "CBADBD",
      "BCDBADB",
      "CADCBCD",
      "CDADCBA"
    ],
    "valid": true,
    "note": "",
    "n_evidence_bag1": null,
    "n_critical_later": null,
    "n_elements_in_pred": null
  }
];
