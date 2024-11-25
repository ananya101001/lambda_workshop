exports.create = async (event) => {
    // Your function logic here
    return {
      statusCode: 200,
      body: JSON.stringify('Hello from Lambda!'),
    };
  };