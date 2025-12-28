
/**
 * Serviço para integração com Google Drive API v3 utilizando Conta de Serviço
 * Esta implementação utiliza SubtleCrypto para assinar o JWT no cliente.
 */

const SERVICE_ACCOUNT_EMAIL = 'gutmatrix@matrizgut.iam.gserviceaccount.com';
const FOLDER_ID = '1CkAMNfWNHMVYDLfovT3l4AYgXep-FzuS';

// Chave Privada corrigida e formatada
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
 * Importa a chave RSA limpando resíduos de formatação
 */
async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const cleanBase64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\\n/g, "") // Remove literais \n (backslash + n)
    .replace(/\s/g, "");  // Remove espaços, quebras de linha reais e tabs
  
  try {
    const binaryDerString = window.atob(cleanBase64);
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
  } catch (e) {
    console.error("Erro crítico na decodificação Base64 da chave:", e);
    throw new Error("Erro de formatação na Chave Privada. Certifique-se de que a chave no código não contém caracteres inválidos.");
  }
}

/**
 * Utilitário Base64URL
 */
function base64UrlEncode(str: string | Uint8Array): string {
  let base64;
  if (typeof str === 'string') {
    base64 = window.btoa(unescape(encodeURIComponent(str)));
  } else {
    const binary = Array.from(str).map(b => String.fromCharCode(b)).join('');
    base64 = window.btoa(binary);
  }
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Gera o Token JWT assinado
 */
async function generateJWT(): Promise<string> {
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: SERVICE_ACCOUNT_EMAIL,
    scope: "https://www.googleapis.com/auth/drive.file",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  const privateKey = await importPrivateKey(PRIVATE_KEY_PEM);
  const signature = await window.crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    privateKey,
    new TextEncoder().encode(dataToSign)
  );

  const encodedSignature = base64UrlEncode(new Uint8Array(signature));
  return `${dataToSign}.${encodedSignature}`;
}

/**
 * Obtém o access_token para a Conta de Serviço
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
      assertion: assertion
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Auth Error: ${error.error_description || error.error}`);
  }

  const data = await response.json();
  cachedToken = {
    token: data.access_token,
    expiry: Date.now() + (data.expires_in - 60) * 1000
  };

  return data.access_token;
}

/**
 * Upload direto para o Google Drive
 */
export const uploadFileToDrive = async (file: File): Promise<{ url: string; name: string }> => {
  try {
    const token = await getAccessToken();

    const metadata = {
      name: `GUT_BIOMETANO_${Date.now()}_${file.name}`,
      mimeType: file.type,
      parents: [FOLDER_ID]
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Erro no upload.");
    }

    const result = await response.json();
    return {
      url: result.webViewLink,
      name: file.name
    };
  } catch (err: any) {
    console.error("Google Drive Error:", err);
    throw new Error(`Falha no armazenamento: ${err.message}`);
  }
};
