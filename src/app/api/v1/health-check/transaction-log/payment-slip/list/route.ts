import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { successResponse, errorResponse } from "@/helpers/api/response";
import { API_URL } from "@/services/api-url";
import { sanitizeForwardHeaders } from "@services/api-header";

interface PaymentSlipRequest {
  school_id: number;
  page: number;
  per_page: number;
  keyword?: string;
  start_date?: string;
  end_date?: string;
  type?: "KBANK_TOPUP_AND_TUTION" | "KBANK_SHOP" | "KTB_ALL";
}

interface PaymentSlipResponse {
  id: string;
  order_id: string;
  object: string;
  amount: string;
  currency: string;
  transaction_state: string;
  source: {
    id: string;
    object: string;
    brand: string;
    card_masking: string | null;
    issuer_bank: string | null;
  };
  created: string;
  status: string;
  reference_order: string;
  description: string;
  livemode: boolean;
  failure_code: string | null;
  failure_message: string | null;
  checksum: string;
}

export async function POST(request: NextRequest) {
  const apiUrl = API_URL.PROD_SB_API_URL;
  const headers = sanitizeForwardHeaders(request);
  const payload: any = await request.json();

  const endpoint = `${apiUrl}/api/v1/payment-slip/list`;
  const fullURL = `${endpoint}`;

  try {
    const body: PaymentSlipRequest = await request.json();
    console.log("Request URL:", fullURL);
    console.log("Request Body:", body);
    console.log("Request Headers:", headers);
    const response = await axios.post<PaymentSlipResponse[]>(fullURL, body, {
      headers: { "Content-Type": "application/json", ...headers },
      timeout: 10000,
    });
    console.log("");

    console.log("Payment Slip Response:", response.data);

    return NextResponse.json(
      successResponse({
        data: response.data,
        status: response.status,
      }),
      { status: response.status }
    );
  } catch (error: any) {
    const statusCode = error.response?.status || 500;
    return NextResponse.json(
      errorResponse({
        message_en: error.message || "Internal Server Error",
        message_th: "เกิดข้อผิดพลาดภายในระบบ",
        status: statusCode,
        error: error.response?.data || null,
      }),
      { status: statusCode }
    );
  }
}
