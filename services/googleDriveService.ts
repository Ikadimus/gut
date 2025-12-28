
/**
 * Integração Google Drive API v3 – IA Studio
 * Gerenciamento de Upload via Conta de Serviço
 */

const SERVICE_ACCOUNT_EMAIL = "gutmatrix@matrizgut.iam.gserviceaccount.com";
const FOLDER_ID = "1CkAMNfWNHMVYDLfovT3l4AYgXep-FzuS";

// Chave privada extraída do JSON do cliente
const PRIVATE_KEY_PEM = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCuSwWm8AEcDMxZ
6gUMqCnt0DADK941RJNgTRtbGjW5Ba6fYa5yub8pyuIhiCEBcerbauESOoNcK6OG
AJpGoWikQ3L/X5OEasRHzQ/YbQ5FGxjl/KNW0W2g6uU44caJOsU2Gc9VzN8bVu0K
u+ooZOPDoeEJgjlGZdPpv6EGTD8zNXbnw3PoBceLQDDsgNyofhyb+WzK+bahoAvh
SRohdOksOvBeZiFub9z4Q5aHc9pIfq2YVu3BBxfGZZ8b7vWPPnK/HwUPcQxqYDiX
dCAoUk6a92qew8bZ8uzEF0X3gwm3kWRBteSSbMR+NSAQZtl4JE+dkEtmpHe6i+bx
6V80aCx1AgMBAAECggEAKQ6HIFH9EOx63ttfoSGj7t9R0A1vZMDorpC7VvSPnywV
fHn4LBJRU7j1F80HaV26Y0GED1U1SGsHNDPEI8s16SvyVPHgwBqebgOCLgtShzjg
3pxqpbLjzjpHEOUubXkop5vg2WdPTxNk91hYyncpqBXj+udwMoMeLjvz5JXldVxI
v3auL17rQtJrEIxa4kN11u8tayF+WdMZT4/HOxihYwRujK3dQ9O+9FSZANnAMzBK
7G0zXFrn8zo1MPpfBexMO/plq2ve/rAbi/xwnrKZR+SPtnA1yzH4ItPBM5YBKzqy
BlcrmahEXgRwdxihMOblgOB9ZZpQGpgBirD8kdUoaQKBgQDqPBKBHTE637u7piHp
U2B5mkpElcQMZIAWmaSn3f4OtsQNcxjdUz2PTRoteSN+pKP4q423J7f8cnyWrc/+
LNi+Zn30/smaaDTzevf05NNalZIJeWsj//HIGTep/By3NlOgpGh9uJi8+nWKZmCB
HaNMZrMOqG/MKbS4xnswdiMr2wKBgQC+fRIgoBh19NE0H3pjJ4If7qnxvvYpq3DD
H6CehjHDSEv6aiaYv4uJh67HDe/Dqa7k3pbfWW3P+ZEBnJeey8YDRi3SDLcPInQQ
JTUnIeEwJBOAeFv7YOxcI6D11jOqvHnfDs5ZEt/E8qvxZ/EuX+AOdgKkjDKm6Fxm
zcOPtDEh7wKBgBYx7wbw/zM29BEJ4vi6/89GAXeSQWtzMnfxwxps/J/kTZuApoCC
XLjxc2OPsP9VFnx/tQP/7X0sVAXrHmRVV4xjJdhLNEs/SJUxt8Eq1aQlvBrNuItG
nu2Bck1u2Gfp6WV5FdelDzqVJjk24+bgCWPDqYlknOMC9yvQfSpkC+L41AoGBAJBJ
Gjb+LSkDxIbvpPuADI91buJ/G+RaSLJzvWz2BrF9jJdkWlHvHJmS3a9G/iq914zi
kXMiQQx8Y/rNiwcsIJOQT9q/6NUc6r7kAAvhHLojSWZRRJL3SnFMR3qOwln8I2/y
vhg4NKjwi47yhXv0ATnS55ON4jwM2xi/mPa7rU+fAoGAD8kDmYilymjUVoApHyFy
vXNBP8eH+lkPxm/nu5fVhjuxPe9wqX1wSCGQtKLMHXlWdbkUX+uOhl1N0V1PfDm/
1EivW26GG2eKefEqSD90Q9FggvQfc8p22/9RoB1VxtYitoFz+/FV/wxBsHN9+LGQ
RWqcjleGSEuXVVVH/T3QCIY=
-----END PRIVATE KEY-----`;

let cachedToken: { token: string; expiry: number } | null = null;

/**
 * Importa a chave privada PEM para o formato CryptoKey
 */
async function importPrivateKey(): Promise<CryptoKey> {
  try {
    // Normalização radical: remove headers e QUALQUER caractere que não seja base64 válido
    const base64 = PRIVATE_KEY_PEM
      .replace(/-----BEGIN PRIVATE KEY-----/, "")
      .replace(/-----END PRIVATE KEY-----/, "")
      .replace(/[^A-Za-z0-9+/=]/g, ""); // Remove espaços, novas linhas e caracteres inválidos

    const binaryDerString = window.atob(base64);
    const binaryDer = new Uint8Array(binaryDerString.length);
    for (let i = 0; i < binaryDerString.length; i++) {
      binaryDer[i] = binaryDerString.charCodeAt(i);
    }

    return await window.crypto.subtle.importKey(
      "pkcs8",
      binaryDer.buffer,
      {
        name: "RSASSA-PKCS1-v1_5",
        hash: "SHA-256",
      },
      false,
      ["sign"]
    );
  } catch (err: any) {
    throw new Error(`Erro fatal na chave privada (atob/import): ${err.message}`);
  }
}

/**
 * Utilitário Base64URL
 */
function base64UrlEncode(data: string | Uint8Array): string {
  let base64;
  if (typeof data === "string") {
    base64 = btoa(unescape(encodeURIComponent(data)));
  } else {
    let binary = "";
    const bytes = new Uint8Array(data);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    base64 = btoa(binary);
  }
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Gera o Assertion JWT para troca por Token de Acesso
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
  const signature = await window.crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(dataToSign)
  );

  return `${dataToSign}.${base64UrlEncode(new Uint8Array(signature))}`;
}

/**
 * Obtém ou renova o Token de Acesso OAuth2 da Google
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

  if (!response.ok) {
    throw new Error(`Falha na autenticação Google: ${data.error_description || data.error}`);
  }

  cachedToken = {
    token: data.access_token,
    expiry: Date.now() + (data.expires_in - 60) * 1000,
  };

  return data.access_token;
}

/**
 * Realiza o upload do arquivo para o Google Drive
 */
export async function uploadFileToDrive(file: File): Promise<{ url: string; name: string }> {
  try {
    const token = await getAccessToken();

    const metadata = {
      name: `GUT_${Date.now()}_${file.name}`,
      parents: [FOLDER_ID],
    };

    const form = new FormData();
    form.append(
      "metadata",
      new Blob([JSON.stringify(metadata)], { type: "application/json" })
    );
    form.append("file", file);

    /**
     * IMPORTANTE: 
     * 1. 'supportsAllDrives=true' permite que a Service Account escreva em pastas de Drives Compartilhados.
     * 2. O erro 'Storage Quota' ocorre porque Service Accounts têm cota 0 no seu 'My Drive'.
     *    A pasta FOLDER_ID deve estar em um DRIVE COMPARTILHADO onde a Service Account tenha permissão de escrita.
     */
    const uploadUrl = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id,name,webViewLink";

    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });

    const result = await response.json();

    if (!response.ok) {
      if (result.error?.message?.includes("quota")) {
        throw new Error(
          "ERRO DE COTA: Contas de serviço não possuem armazenamento próprio. " +
          "Certifique-se de que a pasta de destino (" + FOLDER_ID + ") esteja em um DRIVE COMPARTILHADO (Shared Drive) " +
          "e que a conta " + SERVICE_ACCOUNT_EMAIL + " tenha sido adicionada como membro (Contribuidor/Gerente)."
        );
      }
      throw new Error(result.error?.message || "Erro durante o upload para o Google Drive.");
    }

    return {
      name: result.name,
      url: result.webViewLink,
    };
  } catch (error: any) {
    console.error("Erro Drive Service:", error);
    throw error;
  }
}
