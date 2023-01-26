module.exports = {
  // Stop webpack from munging import.meta.url (this should be the default in
  // Angular but unfortunately it isn't)
  module: {
    parser: {
      javascript: {
        importMeta: false,
      },
    },
  },
};
