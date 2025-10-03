"use client";

import { StarFilled } from "@ant-design/icons";
import {
  Avatar,
  Button,
  Collapse,
  Drawer,
  Empty,
  FloatButton,
  Form,
  Input,
  List,
  Skeleton,
  Space,
  Typography,
} from "antd";
import type { CollapseProps } from "antd";
import axios from "axios";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { FiSend } from "react-icons/fi";
import { toast } from "sonner";

interface ChatMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
  html?: string;
  render?: ReactNode;
}

interface CancellationLog {
  endpoint: string;
  request: Record<string, unknown>;
  response?: unknown;
  error?: {
    message: string;
    status?: number;
    data?: unknown;
  };
  timestamp: number;
}

export interface CancellationExtraction {
  schoolId?: string;
  schoolName?: string;
  schoolNameEN?: string;
  buyerName?: string;
  buyerLastName?: string;
  buyerUserId?: string;
  buyerIdentifier?: string;
  sellerName?: string;
  sellerLastName?: string;
  sellerUserId?: string;
  sellerIdentifier?: string;
  sSellId?: string;
}

interface AiChatWidgetProps {
  title?: string;
  placeholder?: string;
  cancellationLog?: CancellationLog | null;
  onCancellationInfo?: (info: Partial<CancellationExtraction>) => void;
  onConfirmCancellation?: () => Promise<void>;
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const formatMessageContent = (value: string) =>
  escapeHtml(value)
    .replace(/^-\s/gm, "• ")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br />");

//** วิดเจ็ตสนทนา AI แบบปุ่มลอย เปิดเป็น Drawer ด้านขวา
const AiChatWidget = ({
  title = "AI Assistant",
  placeholder = "พิมพ์คำสั่ง เช่น ยกเลิกรายการขายเกิน 7 วัน...",
  cancellationLog,
  onCancellationInfo,
  onConfirmCancellation,
}: AiChatWidgetProps) => {
  const [form] = Form.useForm<{ prompt: string }>();
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "assistant-welcome",
      role: "assistant",
      content:
        "ขอบคุณที่ติดต่อมาค่ะ กรุณาแจ้งข้อมูลเพื่อเตรียมยกเลิกรายการดังต่อไปนี้:\n\n" +
        "1. **ชื่อโรงเรียน** (ภาษาไทย หรืออังกฤษ)\n" +
        "2. **ชื่อ-นามสกุลของผู้ซื้อ**\n" +
        "3. **ชื่อ-นามสกุลของผู้ขาย** (ถ้ามี)\n" +
        "4. **UserID** ของผู้ซื้อและผู้ขาย (ถ้าทราบ)\n" +
        "5. **sSellID** หมายเลขธุรกรรมการซื้อขาย\n\n" +
        "เมื่อส่งข้อมูลครบแล้ว ฉันจะตรวจสอบและแจ้งขั้นตอนต่อไปให้อัตโนมัติค่ะ ✅",
    },
  ]);
  const [isSending, setIsSending] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerWidth, setDrawerWidth] = useState<number>(420);
  const lastCancellationTimestamp = useRef<number | null>(null);

  const hasMessages = chatMessages.length > 0;

  const extractCancellationInfo = (
    rawMessage: string
  ): CancellationExtraction => {
    const info: CancellationExtraction = {};
    let currentRole: "buyer" | "seller" | "" = "";
    let pendingField: "buyerUserId" | "sellerUserId" | "sSellId" | null = null;

    const lines = rawMessage.split(/\n+/);
    for (const originalLine of lines) {
      if (!originalLine) continue;
      const line = originalLine.trim().replace(/^[-•\*]+\s*/, "");
      if (!line) continue;
      const lower = line.toLowerCase();

      if (/(ผู้ซื้อ|buyer)/i.test(lower)) {
        currentRole = "buyer";
      } else if (/(ผู้ขาย|seller)/i.test(lower)) {
        currentRole = "seller";
      }

      const schoolIdMatch = line.match(/school[_\s-]*id\s*[:：]?\s*(\d+)/i);
      if (schoolIdMatch) {
        info.schoolId = schoolIdMatch[1];
      }

      if (/ชื่อโรงเรียน/.test(lower)) {
        const value = line.split(/[:：]/)[1]?.trim();
        if (!value) continue;
        if (/อังกฤษ|english|schoolnameen/.test(lower)) {
          info.schoolNameEN = value;
        } else if (!/อังกฤษ/.test(lower)) {
          info.schoolName = value;
        }
      }

      const transactionMatch =
        line.match(/sSellID\s*[:：]?\s*([\w-]+)/i) ||
        line.match(
          /รหัส\s*ทราน(ซ|ส)เ?คชั?น[\s\-]*การซื้อขาย\s*[:：]?\s*([\w-]+)/i
        );
      if (transactionMatch) {
        const value = (transactionMatch[1] ?? transactionMatch[2] ?? "")
          .trim()
          .replace(/^[-\s]+/, "");
        if (value) {
          info.sSellId = value;
          pendingField = null;
        } else {
          pendingField = "sSellId";
        }
      }

      const userIdMatch = line.match(/user[_\s-]*id[^:：]*[:：]?\s*(.+)?/i);
      if (userIdMatch) {
        const rawValue = userIdMatch[1]?.replace(/^[–\-]\s*/, "").trim();
        const targetField =
          currentRole === "seller" ? "sellerUserId" : "buyerUserId";
        const isLikelyId = rawValue && /^[0-9]+$/.test(rawValue);
        if (rawValue && rawValue !== "—" && isLikelyId) {
          info[targetField] = rawValue;
          pendingField = null;
        } else {
          pendingField = targetField;
        }
        continue;
      }

      if (pendingField && line) {
        const value = line.replace(/^[–\-]\s*/, "").trim();
        if (value && value !== "—" && !/ไม่มี|not\s*required/i.test(value)) {
          if (
            pendingField === "buyerUserId" ||
            pendingField === "sellerUserId"
          ) {
            if (/^[0-9]+$/.test(value)) {
              info[pendingField] = value;
            }
          } else {
            info[pendingField] = value;
          }
        }
        pendingField = null;
      }

      const nameMatch = line.match(/ชื่อ(?!โรงเรียน)[^:：]*[:：]\s*(.+)/i);
      if (nameMatch) {
        const value = nameMatch[1].trim();
        if (value && value !== "—") {
          if (currentRole === "seller") {
            info.sellerName = value;
          } else {
            info.buyerName = value;
          }
        }
      }

      const lastNameMatch = line.match(/นามสกุล[^:：]*[:：]\s*(.+)/i);
      if (lastNameMatch) {
        const value = lastNameMatch[1].trim();
        if (value && value !== "—") {
          if (currentRole === "seller") {
            info.sellerLastName = value;
          } else {
            info.buyerLastName = value;
          }
        }
        continue;
      }

      const identifierMatch = line.match(/รหัสประจำตัว[^:：]*[:：]\s*(.+)/i);
      if (identifierMatch) {
        const value = identifierMatch[1].replace(/^[–\-]\s*/, "").trim();
        if (value && value !== "—" && !/ไม่มี/i.test(value)) {
          if (currentRole === "seller") {
            info.sellerIdentifier = value;
          } else {
            info.buyerIdentifier = value;
          }
        }
        continue;
      }

      if (pendingField === "sSellId" && line) {
        const value = line.replace(/^[–\-]\s*/, "").trim();
        if (value && value !== "—" && !/ไม่มี/.test(value)) {
          info.sSellId = value;
        }
        pendingField = null;
      }
    }

    return info;
  };

  const emitCancellationInfo = (
    payload: string | Partial<CancellationExtraction>
  ) => {
    if (!onCancellationInfo) return;

    if (typeof payload === "string") {
      if (!payload) return;
      const info = extractCancellationInfo(payload);
      if (Object.values(info).some((value) => Boolean(value))) {
        onCancellationInfo(info);
      }
      return;
    }

    if (Object.values(payload).some((value) => Boolean(value))) {
      onCancellationInfo(payload);
    }
  };

  useEffect(() => {
    const calculateDrawerWidth = () => {
      if (typeof window === "undefined") {
        return 420;
      }

      const viewportWidth = window.innerWidth;

      if (viewportWidth <= 640) {
        return viewportWidth;
      }

      if (viewportWidth <= 1024) {
        return Math.round(viewportWidth * 0.65);
      }

      return Math.round(viewportWidth * 0.5);
    };

    const updateWidth = () => {
      setDrawerWidth(calculateDrawerWidth());
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  useEffect(() => {
    if (!cancellationLog) {
      return;
    }

    if (lastCancellationTimestamp.current === cancellationLog.timestamp) {
      return;
    }

    lastCancellationTimestamp.current = cancellationLog.timestamp;

    const isError = Boolean(cancellationLog.error);
    const statusLabel = isError
      ? "ไม่สามารถยกเลิกรายการได้"
      : "ยกเลิกรายการสำเร็จ";
    const descriptionText = cancellationLog.error?.message
      ? cancellationLog.error.message
      : "ระบบได้ส่งคำขอไปยัง API เรียบร้อย โปรดตรวจสอบรายละเอียดได้จากข้อมูลด้านล่าง";
    const noteText =
      typeof (cancellationLog.error as any)?.data?.note === "string"
        ? String((cancellationLog.error as any)?.data?.note)
        : undefined;

    const requestEntries = Object.entries(cancellationLog.request ?? {});
    const requestSummary =
      requestEntries.length > 0 ? (
        <ul className="api-summary-list">
          {requestEntries.map(([key, value]) => {
            const displayValue =
              value === undefined || value === null || value === ""
                ? "—"
                : String(value);
            return (
              <li key={key}>
                <strong>{key}:</strong> {displayValue}
              </li>
            );
          })}
        </ul>
      ) : null;

    const contextSummary = cancellationLog.context ? (
      <ul className="api-summary-list">
        {cancellationLog.context.school && (
          <li>
            <strong>โรงเรียน:</strong> {cancellationLog.context.school}
          </li>
        )}
        {cancellationLog.context.buyer && (
          <li>
            <strong>ผู้ซื้อ:</strong> {cancellationLog.context.buyer}
          </li>
        )}
        {cancellationLog.context.seller && (
          <li>
            <strong>ผู้ขาย:</strong> {cancellationLog.context.seller}
          </li>
        )}
        {cancellationLog.context.sSellId && (
          <li>
            <strong>รหัสธุรกรรม:</strong> {cancellationLog.context.sSellId}
          </li>
        )}
      </ul>
    ) : null;

    const requestJson = JSON.stringify(cancellationLog.request ?? {}, null, 2);
    const responseJson =
      cancellationLog.response !== undefined
        ? JSON.stringify(cancellationLog.response, null, 2)
        : null;
    const errorDataJson = cancellationLog.error?.data
      ? JSON.stringify(cancellationLog.error.data, null, 2)
      : null;

    const collapseItems: CollapseProps["items"] = [
      {
        key: "endpoint",
        label: "Endpoint",
        children: (
          <Typography.Text code>{cancellationLog.endpoint}</Typography.Text>
        ),
      },
      {
        key: "request",
        label: "Request Payload",
        children: <pre className="api-response-block">{requestJson}</pre>,
      },
      {
        key: "response",
        label: "Response Payload",
        children: responseJson ? (
          <pre className="api-response-block">{responseJson}</pre>
        ) : (
          <div className="api-empty">ไม่มีการตอบกลับจาก API</div>
        ),
      },
    ];

    if (cancellationLog.error?.status) {
      collapseItems.push({
        key: "status",
        label: "Status Code",
        children: (
          <Typography.Text>{cancellationLog.error.status}</Typography.Text>
        ),
      });
    }

    if (errorDataJson) {
      collapseItems.push({
        key: "error-data",
        label: "รายละเอียดข้อผิดพลาด",
        children: <pre className="api-response-block">{errorDataJson}</pre>,
      });
    }

    const cancellationMessage: ChatMessage = {
      id: `assistant-cancel-${cancellationLog.timestamp}`,
      role: "assistant",
      content: "",
      render: (
        <Space direction="vertical" size={8} className="api-log-container">
          <Typography.Text
            strong
            className={`api-status-text ${isError ? "error" : "success"}`}
          >
            {statusLabel}
          </Typography.Text>
          <Typography.Text>{descriptionText}</Typography.Text>
          {noteText && (
            <Typography.Text italic type="secondary">
              {noteText}
            </Typography.Text>
          )}
          {contextSummary}
          {!contextSummary && requestSummary}
          {contextSummary && requestSummary}
          <Collapse
            className="api-collapse"
            expandIconPosition="end"
            ghost
            size="small"
            items={collapseItems}
          />
        </Space>
      ),
    };

    setChatMessages((prev) => [...prev, cancellationMessage]);
  }, [cancellationLog]);

  //** ส่งข้อความไปยัง Gemini และอัปเดตประวัติสนทนา
  const handleSubmit = async (values: { prompt: string }) => {
    const trimmedPrompt = values.prompt.trim();
    if (!trimmedPrompt) {
      return;
    }

    const toastId = toast.loading("กำลังติดต่อ AI ...");
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmedPrompt,
    };

    emitCancellationInfo(trimmedPrompt);

    const nextMessages = [...chatMessages, userMessage];
    setChatMessages(nextMessages);
    setIsSending(true);
    form.resetFields();

    try {
      const latestMessages = nextMessages.slice(-12);
      const filteredMessages = latestMessages.filter(
        ({ content }) =>
          typeof content === "string" && content.trim().length > 0
      );
      const dedupedMessages = filteredMessages.filter((message, index, arr) => {
        if (index === 0) return true;
        const previous = arr[index - 1];
        return !(
          previous.role === message.role && previous.content === message.content
        );
      });

      const payloadMessages = dedupedMessages
        .slice(-8)
        .map(({ role, content }) => ({
          role,
          content,
        }));

      const response = await axios.post(
        "/api/v1/ai/gemini/chat/cancel-sales",
        { messages: payloadMessages },
        { timeout: 12_000 }
      );

      const replyText = response.data?.data?.reply as string | undefined;
      if (replyText) {
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: replyText,
        };

        const messagesToAppend: ChatMessage[] = [assistantMessage];

        toast.success("ได้รับคำตอบจาก AI แล้ว", { id: toastId });

        emitCancellationInfo(replyText);

        const extractionMeta = response.data?.data?.meta?.extraction;
        const schoolMatch = response.data?.data?.meta?.schoolMatch;
        const buyerMatch = response.data?.data?.meta?.buyerMatch;
        const sellerMatch = response.data?.data?.meta?.sellerMatch;

        if (extractionMeta && typeof extractionMeta === "object") {
          emitCancellationInfo(
            Object.entries(extractionMeta).reduce((acc, [key, value]) => {
              if (value !== undefined && value !== null) {
                acc[key as keyof CancellationExtraction] = String(value);
              }
              return acc;
            }, {} as Partial<CancellationExtraction>)
          );

          const summaryItems: string[] = [];
          if (schoolMatch?.schoolId || extractionMeta.schoolId) {
            const schoolLabel =
              schoolMatch?.schoolName || extractionMeta.schoolName;
            const schoolPrimId =
              schoolMatch?.schoolId || extractionMeta.schoolId;
            if (schoolLabel || schoolPrimId) {
              summaryItems.push(
                `โรงเรียน: ${(schoolLabel || "ไม่ทราบ").trim()} (${
                  schoolPrimId || "ไม่ทราบ"
                })`
              );
            }
          }

          const buyerLabel = buyerMatch?.name || extractionMeta.buyerName || "";
          const buyerLast =
            buyerMatch?.lastName || extractionMeta.buyerLastName || "";
          const buyerId =
            buyerMatch?.userId || extractionMeta.buyerUserId || "ไม่ทราบ";
          if (buyerLabel || buyerLast || buyerMatch?.userId) {
            const displayName =
              [buyerLabel, buyerLast].filter(Boolean).join(" ") || "ไม่ทราบ";
            summaryItems.push(`ผู้ซื้อ: ${displayName} (${buyerId})`);
          }

          const sellerLabel =
            sellerMatch?.name || extractionMeta.sellerName || "";
          const sellerLast =
            sellerMatch?.lastName || extractionMeta.sellerLastName || "";
          const sellerId =
            sellerMatch?.userId || extractionMeta.sellerUserId || "ไม่ทราบ";
          if (sellerLabel || sellerLast || sellerMatch?.userId) {
            const displayName =
              [sellerLabel, sellerLast].filter(Boolean).join(" ") || "ไม่ทราบ";
            summaryItems.push(`ผู้ขาย: ${displayName} (${sellerId})`);
          }

          if (extractionMeta.sSellId) {
            summaryItems.push(
              `รหัสธุรกรรม (sSellID): ${extractionMeta.sSellId}`
            );
          }

          if (summaryItems.length) {
            const summaryHtml =
              `<strong>ข้อมูลตรวจสอบล่าสุด</strong><br /><ul>` +
              summaryItems.map((item) => `<li>${item}</li>`).join("") +
              "</ul>";
            messagesToAppend.push({
              id: `assistant-summary-${Date.now()}`,
              role: "assistant",
              content: "",
              html: summaryHtml,
            });
          }
        }

        setChatMessages([...nextMessages, ...messagesToAppend]);

        const normalizedPrompt = trimmedPrompt.replace(/\s+/g, "");
        const shouldTriggerCancellation = normalizedPrompt.includes("ยืนยัน");

        if (shouldTriggerCancellation && onConfirmCancellation) {
          try {
            await onConfirmCancellation();
          } catch (error: unknown) {
            const message =
              error instanceof Error
                ? error.message
                : typeof error === "string"
                ? error
                : "ไม่สามารถยกเลิกรายการได้";
            const errorMessage: ChatMessage = {
              id: `assistant-error-${Date.now()}`,
              role: "assistant",
              content: "",
              html: `<strong>ไม่สามารถยกเลิกรายการได้</strong><br />${escapeHtml(
                message
              )}<br /><span class="api-hint">ดูรายละเอียดของคำขอในส่วนบันทึกด้านล่าง</span>`,
            };
            setChatMessages((previous) => [...previous, errorMessage]);
          }
        }
      } else {
        toast.error("AI ไม่สามารถตอบกลับได้", { id: toastId });
      }
    } catch (error: unknown) {
      toast.error("เชื่อมต่อ AI ไม่สำเร็จ", { id: toastId });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <FloatButton
        type="primary"
        shape="circle"
        icon={<StarFilled style={{ fontSize: 20, color: "#ffffff" }} />}
        tooltip={<span>เปิดแชท AI ผู้ช่วย</span>}
        onClick={() => setIsDrawerOpen(true)}
        style={{
          right: 28,
          bottom: 28,
          boxShadow: "0 18px 32px rgba(37, 99, 235, 0.28)",
          background: "linear-gradient(135deg, #2563eb, #7c3aed)",
        }}
      />

      <Drawer
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        placement="right"
        width={drawerWidth}
        title={null}
        closable={false}
        destroyOnClose
        styles={{
          body: { padding: 0, background: "transparent" },
          mask: { backgroundColor: "rgba(15, 23, 42, 0.35)" },
        }}
      >
        <div className="ai-chat-wrapper">
          <div className="drawer-header">
            <Space align="center" size={12}>
              <Avatar
                size={44}
                style={{
                  background: "linear-gradient(135deg, #2563eb, #7c3aed)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <StarFilled />
              </Avatar>
              <div>
                <Typography.Title level={4} className="drawer-title">
                  {title}
                </Typography.Title>
                <Typography.Text type="secondary">
                  Customer Success AI Helper
                </Typography.Text>
              </div>
            </Space>
            <Button type="text" onClick={() => setIsDrawerOpen(false)}>
              ปิด
            </Button>
          </div>

          <div className="drawer-body">
            <div className="chat-intro">
              <Typography.Paragraph type="secondary" className="intro-text">
                ส่งข้อมูลให้ครบถ้วน แล้วรอฉันทวนข้อมูลก่อนพิมพ์คำว่า
                <Typography.Text strong> “ยืนยัน” </Typography.Text>
                เพื่อเริ่มกระบวนการยกเลิกค่ะ
              </Typography.Paragraph>
            </div>

            <div className="chat-history">
              {hasMessages ? (
                <List
                  dataSource={chatMessages}
                  rowKey={(item) => item.id}
                  split={false}
                  renderItem={(item) => (
                    <List.Item className="chat-item">
                      <Space
                        align="start"
                        style={{
                          width: "100%",
                          justifyContent:
                            item.role === "user" ? "flex-end" : "flex-start",
                        }}
                      >
                        {item.role === "assistant" && (
                          <Avatar size={32} style={{ background: "#2563eb" }}>
                            AI
                          </Avatar>
                        )}

                        <div className={`chat-bubble ${item.role}`}>
                          <Typography.Text strong className="speaker-label">
                            {item.role === "assistant" ? "AI" : "คุณ"}
                          </Typography.Text>
                          <Typography.Paragraph className="message-text">
                            {item.render ? (
                              item.render
                            ) : (
                              <span
                                dangerouslySetInnerHTML={{
                                  __html:
                                    item.html ??
                                    formatMessageContent(item.content),
                                }}
                              />
                            )}
                          </Typography.Paragraph>
                        </div>

                        {item.role === "user" && (
                          <Avatar size={32} style={{ background: "#0f172a" }}>
                            U
                          </Avatar>
                        )}
                      </Space>
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="ยังไม่มีประวัติการสนทนา" />
              )}

              {isSending && (
                <div className="chat-item">
                  <Space align="start">
                    <Avatar size={32} style={{ background: "#2563eb" }}>
                      AI
                    </Avatar>
                    <div className="chat-bubble assistant">
                      <Skeleton active paragraph={{ rows: 2 }} title={false} />
                    </div>
                  </Space>
                </div>
              )}
            </div>

            <Form form={form} layout="vertical" onFinish={handleSubmit}>
              <Form.Item
                name="prompt"
                label="พิมพ์คำสั่ง"
                rules={[{ required: true, message: "กรุณากรอกคำสั่ง" }]}
              >
                <Input.TextArea
                  placeholder={placeholder}
                  autoSize={{ minRows: 2, maxRows: 4 }}
                  allowClear
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={isSending}
                  icon={<FiSend />}
                  block
                >
                  ส่งคำสั่งถึง AI
                </Button>
              </Form.Item>
            </Form>
          </div>
        </div>

        <style jsx>{`
          .ai-chat-wrapper {
            height: 100%;
            display: flex;
            flex-direction: column;
            background: linear-gradient(
              160deg,
              rgba(248, 250, 252, 0.95),
              #ffffff
            );
            color: #0f172a;
          }

          .drawer-header {
            padding: 20px 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid rgba(15, 23, 42, 0.08);
          }

          .drawer-title {
            margin-bottom: 0;
          }

          .drawer-body {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 16px;
            padding: 0 24px 24px;
          }

          .chat-intro {
            margin-top: 16px;
          }

          .intro-text {
            margin-bottom: 0;
          }

          .chat-history {
            flex: 1;
            overflow-y: auto;
            padding: 16px;
            border-radius: 18px;
            background: rgba(248, 250, 252, 0.75);
            display: flex;
            flex-direction: column;
            gap: 12px;
            box-shadow: inset 0 2px 10px rgba(15, 23, 42, 0.05);
          }

          .chat-item {
            width: 100%;
          }

          .chat-bubble {
            padding: 14px 18px;
            border-radius: 18px;
            background: rgba(255, 255, 255, 0.96);
            border: 1px solid rgba(15, 23, 42, 0.08);
            max-width: 78%;
            box-shadow: 0 6px 16px rgba(15, 23, 42, 0.08);
          }

          .chat-bubble.assistant {
            background: rgba(37, 99, 235, 0.1);
            border-color: rgba(37, 99, 235, 0.24);
          }

          .chat-bubble.user {
            background: rgba(15, 23, 42, 0.05);
            border-color: rgba(15, 23, 42, 0.1);
          }

          .speaker-label {
            display: block;
            margin-bottom: 4px;
          }

          .message-text {
            margin-bottom: 0;
            white-space: pre-wrap;
          }

          .message-text .api-response-block {
            margin-top: 8px;
            padding: 12px;
            border-radius: 12px;
            background: rgba(15, 23, 42, 0.06);
            border: 1px solid rgba(15, 23, 42, 0.08);
            font-family: "SFMono-Regular", Menlo, Monaco, Consolas,
              "Liberation Mono", "Courier New", monospace;
            font-size: 12px;
            white-space: pre-wrap;
            max-height: 220px;
            overflow: auto;
          }

          .api-log-container {
            width: 100%;
          }

          .api-status-text {
            font-size: 16px;
          }

          .api-status-text.success {
            color: #15803d;
          }

          .api-status-text.error {
            color: #dc2626;
          }

          .api-summary-list {
            margin: 12px 0;
            padding-left: 20px;
            color: inherit;
          }

          .api-summary-list li {
            margin-bottom: 4px;
          }

          .api-empty {
            margin-top: 8px;
            padding: 12px;
            border-radius: 10px;
            background: rgba(15, 23, 42, 0.06);
            border: 1px dashed rgba(15, 23, 42, 0.12);
            font-size: 12px;
          }

          .api-hint {
            display: inline-block;
            margin-top: 6px;
            font-size: 12px;
            color: #64748b;
          }

          .api-collapse :global(.ant-collapse-item) {
            border: none !important;
          }

          .api-collapse :global(.ant-collapse-header) {
            padding: 8px 0 !important;
            font-weight: 600;
          }

          .api-collapse :global(.ant-collapse-content) {
            background: transparent !important;
          }

          .api-collapse :global(.ant-collapse-content-box) {
            padding: 8px 0 !important;
          }

          @media (prefers-color-scheme: dark) {
            .ai-chat-wrapper {
              background: linear-gradient(
                160deg,
                rgba(15, 23, 42, 0.92),
                rgba(30, 41, 59, 0.92)
              );
              color: #e2e8f0;
            }

            .drawer-header {
              border-bottom: 1px solid rgba(148, 163, 184, 0.25);
            }

            .drawer-body {
              padding: 0 20px 20px;
            }

            .chat-history {
              background: rgba(30, 41, 59, 0.7);
              box-shadow: inset 0 2px 12px rgba(0, 0, 0, 0.3);
            }

            .chat-bubble {
              background: rgba(148, 163, 184, 0.18);
              border-color: rgba(148, 163, 184, 0.3);
              color: #e2e8f0;
            }

            .chat-bubble.assistant {
              background: rgba(59, 130, 246, 0.24);
              border-color: rgba(96, 165, 250, 0.45);
            }

            .chat-bubble.user {
              background: rgba(148, 163, 184, 0.2);
              border-color: rgba(148, 163, 184, 0.32);
            }

            .message-text .api-response-block {
              background: rgba(148, 163, 184, 0.22);
              border-color: rgba(148, 163, 184, 0.32);
            }

            .api-summary-list li {
              color: #e2e8f0;
            }

            .api-empty {
              background: rgba(148, 163, 184, 0.22);
              border-color: rgba(148, 163, 184, 0.35);
            }

            .api-hint {
              color: #cbd5f5;
            }

            .api-status-text.success {
              color: #31c48d;
            }

            .api-status-text.error {
              color: #f87171;
            }
          }
        `}</style>
      </Drawer>
    </>
  );
};

export default AiChatWidget;
