// This is the server-side function that talks to the Anthropic API.
// It runs on Netlify's servers, so there are no browser security issues.

exports.handler = async function (event) {
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "API key not configured. Please add ANTHROPIC_API_KEY in Netlify → Site configuration → Environment variables, then redeploy." }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid request body." }) };
  }

  // Forward the request to Anthropic
  let response;
  try {
    response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });
  } catch (networkError) {
    return {
      statusCode: 502,
      body: JSON.stringify({ error: "Could not reach Anthropic API: " + networkError.message }),
    };
  }

  const data = await response.json();

  // If Anthropic returned an error, surface it clearly
  if (!response.ok) {
    return {
      statusCode: response.status,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: data.error?.message || JSON.stringify(data) }),
    };
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  };
};
