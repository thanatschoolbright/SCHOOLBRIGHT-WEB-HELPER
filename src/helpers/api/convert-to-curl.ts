export const convertToCurl = (
  apiUrl: string,
  endpoint: string,
  header?: string,
  object?: any,
) => {
  const callAPI = apiUrl + endpoint;
  try {
    const curlHeader = header
      ? `--header '${header}'`
      : `--header 'Content-Type: application/json'`;

    let data = "";
    if (object) {
      if (typeof object === "string") {
        data = `--data-raw '${object}'`;
      } else {
        data = `--data-raw '${JSON.stringify(object)}'`;
      }
    }

    const result = `curl --location '${callAPI}' ${curlHeader} ${data}`;
    return result;
  } catch (error: any) {
    throw new Error(`Error in function [convertToCurl] , [call : ${callAPI}]`);
  }
};
