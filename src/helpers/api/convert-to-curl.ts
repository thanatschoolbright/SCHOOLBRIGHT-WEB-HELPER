export const convertToCurl = (
  apiUrl: string,
  endpoint: string,
  header?: string,
  object?: any
) => {
  const callAPI = apiUrl + endpoint;
  try {
    const curlHeader = header ?? `--header 'Content-Type: application/json'`;
    const data = ``;
    const result = `curl --location ${curlHeader} \ '${callAPI}' `;
    return result;
  } catch (error: any) {
    throw new Error(`Error in function [convertToCurl] , [call : ${callAPI}]`);
  }
};
