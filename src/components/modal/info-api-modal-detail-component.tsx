import React, { useState } from "react";

const ModalAPIDetail = ({ row }: any) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(row?.curl || "");
      setCopied(true);
      // ซ่อน toast หลัง 2 วินาที
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed", err);
    }
  };
  return (
    <div className="space-y-6 text-sm text-gray-700">
      {/* Method & Status */}
      <div className="flex items-center flex-wrap gap-4">
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">
            Method
          </h3>
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium
          ${row.method === "GET" ? "bg-green-100 text-green-700" : ""}
          ${row.method === "POST" ? "bg-blue-100 text-blue-700" : ""}
          ${row.method === "PUT" ? "bg-yellow-100 text-yellow-800" : ""}
          ${
            row.method === "DELETE"
              ? "bg-red-100 text-red-700"
              : "bg-gray-100 text-gray-600"
          }
        `}
          >
            {row.method}
          </span>
        </div>
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">
            Status
          </h3>
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium
          ${row.status.startsWith("2") ? "bg-green-100 text-green-800" : ""}
          ${row.status.startsWith("4") ? "bg-yellow-100 text-yellow-800" : ""}
          ${
            row.status.startsWith("5")
              ? "bg-red-100 text-red-800"
              : "bg-gray-100 text-gray-700"
          }
        `}
          >
            {row.status}{" "}
            {row.status.startsWith("2")
              ? "(v)"
              : row.status.startsWith("5")
              ? "(x)"
              : "(!)"}
          </span>
        </div>
      </div>

      {/* URL */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">
          URL
        </h3>
        <p className="break-all text-sm font-medium text-gray-800 bg-gray-50 p-2 rounded-md">
          {row.url}
        </p>
      </div>

      {/* Toast */}
      {copied && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-3 py-2 rounded shadow-lg animate-fade-in-out">
          Copied!
        </div>
      )}

      {/* cURL Command */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-xs font-semibold text-gray-500 uppercase">
            cURL Command
          </h3>
          <button
            onClick={handleCopy}
            className="text-xs text-blue-600 hover:underline"
          >
            Copy
          </button>
        </div>
        <pre className="bg-gray-100 p-3 rounded-md whitespace-pre-wrap text-xs text-gray-800">
          {row?.curl}
        </pre>
      </div>

      {/* Headers */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">
          Headers
        </h3>
        <div className="bg-gray-50 rounded-md p-3 text-xs space-y-1">
          {(row.headers || []).map((h: any, idx: number) => (
            <div key={idx}>
              <span className="font-medium text-gray-700">{h.key}</span>:{" "}
              <span className="text-gray-600">{h.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Request Body */}
      {row.request?.body?.raw && (
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">
            Request Body
          </h3>
          <pre className="bg-gray-100 p-3 rounded-md whitespace-pre-wrap text-xs text-gray-800">
            {row.request.body.raw}
          </pre>
        </div>
      )}

      {/* Response Body */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">
          Response Body
        </h3>
        <pre className="bg-gray-100 p-3 rounded-md whitespace-pre-wrap text-xs text-gray-800">
          {(() => {
            try {
              const decoded = new TextDecoder().decode(
                new Uint8Array(row.response.stream.data)
              );
              const json = JSON.parse(decoded);
              return JSON.stringify(json, null, 2);
            } catch (e) {
              return "(!) Unable to parse response as JSON.";
            }
          })()}
        </pre>
      </div>

      {/* Assertions Table */}
      {row.assertions?.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
            Assertions
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 text-xs text-left">
              <thead className="bg-gray-100 text-gray-600 uppercase">
                <tr>
                  <th className="px-3 py-2 border-b">Test</th>
                  <th className="px-3 py-2 border-b">Result</th>
                </tr>
              </thead>
              <tbody>
                {row.assertions.map((assert: any, index: number) => (
                  <tr key={index} className="border-b">
                    <td className="px-3 py-2">{assert.assertion}</td>
                    <td className="px-3 py-2 font-medium">
                      {assert.error ? (
                        <span className="text-red-600">
                          (x) {assert.error.message}
                        </span>
                      ) : (
                        <span className="text-green-600">(v) Passed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModalAPIDetail;
