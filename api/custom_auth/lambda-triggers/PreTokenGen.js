module.exports.handler = async (event, context) => {
  event.response = {
    "claimsOverrideDetails": {
      "claimsToSuppress": ["given_name", "family_name"]
    }
  };
  return event;
  };