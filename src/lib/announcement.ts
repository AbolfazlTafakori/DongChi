import fs from "fs";
import path from "path";

export interface SystemAnnouncement {
  id: string;
  message: string;
  type: "info" | "warning" | "success";
  isActive: boolean;
  updatedAt: string;
}

let inMemoryAnnouncement: SystemAnnouncement = {
  id: "default-announcement",
  message: "به سامانه نسخه ۲.۴ دنگ‌چی خوش آمدید. تمامی سرویس‌های بانکی و دنگ‌بندی در وضعیت پایدار هستند.",
  type: "info",
  isActive: true,
  updatedAt: new Date().toISOString(),
};

export function getSystemAnnouncement(): SystemAnnouncement {
  return inMemoryAnnouncement;
}

export function setSystemAnnouncement(data: {
  message: string;
  type?: "info" | "warning" | "success";
  isActive?: boolean;
}): SystemAnnouncement {
  inMemoryAnnouncement = {
    id: `announcement-${Date.now()}`,
    message: data.message.trim(),
    type: data.type || "info",
    isActive: data.isActive !== undefined ? data.isActive : true,
    updatedAt: new Date().toISOString(),
  };
  return inMemoryAnnouncement;
}
