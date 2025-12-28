/**
 * Integração Google Drive API v3 – IA Studio
 * Usa chave vinda DIRETAMENTE do JSON da Service Account
 */

const SERVICE_ACCOUNT_EMAIL =
  "gutmatrix@matrizgut.iam.gserviceaccount.com";

const FOLDER_ID = "1CkAMNfWNHMVYDLfovT3l4AYgXep-FzuS";

/**
 * Chave exatamente como vem do JSON (COM \n)
 */
const PRIVATE_KEY_JSON =
  "-----BEGIN PRIVATE KEY-----\\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCuSwWm8AEcDMxZ\\n6gUMqCnt0DADK941RJNgTRtbGjW5Ba6fYa5yub8pyuIhiCEBcerbauESOoNcK6OG\\nAJpGoWikQ3L/X5OEasRHzQ/YbQ5FGxjl/KNW0W2g6uU44caJOsU2Gc9VzN8bVu0K\\nu+ooZOPDoeEJgjlGZdPpv6EGTD8zNXbnw3PoBceLQDDsgNyofhyb+WzK+bahoAvh\\nSRohdOksOvBeZiFub9z4Q5aHc9pIfq2YVu3BBxfGZZ8b7vWPPnK/HwUPcQxqYDiX\\ndCAoUk6a92qew8bZ8uzEF0X3gwm3kWRBteSSbMR+NSAQZtl4JE+dkEtmpHe6i+bx\\n6V80aCx1AgMBAAECggEAKQ6HIFH9EOx63ttfoSGj7t9R0A1vZMDorpC7VvSPnywV\\nfHn4LBJRU7j1F80HaV26Y0GED1U1SGsHNDPEI8s16SvyVPHgwBqebgOCLgtShzjg\\n3pxqpbLjzjpHEOUubXkop5vg2WdPTxNk91hYyncpqBXj+udwMoMeLjvz5JXldVxI\\nv3auL17rQtJrEIxa4kN11u8tayF+WdMZT4/HOxihYwRujK3dQ9O+9FSZANnAMzBK\\n7G0zXFrn8zo1MPpfBexMO/plq2ve/rAbi/xwnrKZR+SPtnA1yzH4ItPBM5YBKzqy\\nBlcrmahEXgRwdxihMOblgOB9ZZpQGpgBirD8kdUoaQKBgQDqPBKBHTE637u7piHp\\nU2B5mkpElcQMZIAWmaSn3f4OtsQNcxjdUz2PTRoteSN+pKP4q423J7f8cnyWrc/+\\nLNi+Zn30/smaaDTzevf05NNalZIJeWsj//HIGTep/By3NlOgpGh9uJi8+nWKZmCB\\nHaNMZrMOqG/MKbS4xnswdiMr2wKBgQC+fRIgoBh19NE0H3pjJ4If7qnxvvYpq3DD\\nH6CehjHDSEv6aiaYv4uJh67HDe/Dqa7k3pbfWW3P+ZEBnJeey8YDRi3SDLcPInQQ\\nJTUnIeEwJBOAeFv7YOxcI6D11jOqvHnfDs5ZEt/E8qvxZ/EuX+AOdgKkjDKm6Fxm\\nzcOPtDEh7wKBgBYx7wbw/zM29BEJ4vi6/89GAXeSQWtzMnfxwxps/J/kTZuApoCC\\nXLjxc2OPsP9VFnx/tQP/7X0sVAXrHmRVV4xjJdhLNEs/SJUxt8Eq1aQlvBrNuItG\\nu2Bck1u2Gfp6WV5FdelDzqVJjk24+bgCWPDqYlknOMC9yvQfSpkC+L41AoGBAJBJ\\nGjb+LSkDxIbvpPuADI91buJ/G+RaSLJzvWz2BrF9jJdkWlHvHJmS3a9G/iq914zi\\nkXMiQQx8Y/rNiwcsIJOQT9q/6NUc6r7kAAvhHLojSWZRRJL3SnFMR3qOwln8I2/y\\nvhg4NKjwi47yhXv0ATnS55ON4jwM2xi/mPa7rU+fAoGAD8kDmYilymjUVoApHyFy\\nvXNBP8eH+lkPxm/nu5fVhjuxPe9wqX1wSCGQtKLMHXlWdbkUX+uOhl1N0V1PfDm/\\n1EivW26GG2eKefEqSD90Q9FggvQfc8p22/9RoB1VxtYitoFz+/FV/wxBsHN9+LGQ\\nRWqcjleGSEuXVVVH/T3QCIY=\\n-----END PRIVATE KEY-----\\n";

let cachedToken: { token: string; expiry: number } | null = null;

/**
 * Importação CORRETA da chave PKCS8
 */
async function importPrivateKey(): Promise<CryptoKey> {
  // 1️⃣ Converte \n literais em quebra real
  const pem = PRIVATE_KEY_JSON.replace(/\\n/g, "\n");

  // 2️⃣ Extrai SOMENTE o conteúdo Base64 entre os headers
  const match = pem.match(
    /-----BEGIN PRIVATE KEY-----([\s\S]*?)-----END PRIVATE KEY-----/
  );

  if (!match) {
    throw new Error("Formato PEM inválido: headers não encontrados");
  }

  // 3️⃣ Remove qualquer coisa que não seja Base64
  const base64 = match[1].replace(/[^A-Za-z0-9+/=]/g, "");

  let binaryDer: Uint8Array;
  try {
    binaryDer = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  } catch (e) {
    console.error("Base64 inválido:", base64.slice(0, 50));
    throw new Error("Erro fatal na chave privada: Base64 inválido");
  }

  return crypto.subtle.importKey(
    "pkcs8",
    binaryDer.buffer,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"]
  );
}

/**
 * Base64URL
 */
function base64UrlEncode(data: string | Uint8Array): string {
  const base64 =
    typeof data === "string"
      ? btoa(unescape(encodeURIComponent(data)))
      : btoa(String.fromCharCode(...data));

  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Gera JWT
 */
async function generateJWT(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: SERVICE_ACCOUNT_EMAIL,
    scope: "https://www.googleapis.com/auth/drive.file",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  const key = await importPrivateKey();

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(dataToSign)
  );

  return `${dataToSign}.${base64UrlEncode(new Uint8Array(signature))}`;
}

/**
 * Token OAuth
 */
async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiry > Date.now()) {
    return cachedToken.token;
  }

  const assertion = await generateJWT();

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  const data = await response.json();

  cachedToken = {
    token: data.access_token,
    expiry: Date.now() + (data.expires_in - 60) * 1000,
  };

  return data.access_token;
}

/**
 * Upload para o Drive
 */
export async function uploadFileToDrive(
  file: File
): Promise<{ url: string; name: string }> {
  const token = await getAccessToken();

  const metadata = {
    name: `GUT_BIOMETANO_${Date.now()}_${file.name}`,
    parents: [FOLDER_ID],
  };

  const form = new FormData();
  form.append(
    "metadata",
    new Blob([JSON.stringify(metadata)], { type: "application/json" })
  );
  form.append("file", file);

  const response = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=webViewLink,name",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    }
  );

  const result = await response.json();

  return {
    url: result.webViewLink,
    name: result.name,
  };
}

