import { MapPin } from "lucide-react";

export function createMapMarkerElement(
  verified = false
) {
  const wrapper =
    document.createElement("div");

  wrapper.style.width = "42px";
  wrapper.style.height = "42px";
  wrapper.style.display = "flex";
  wrapper.style.alignItems = "center";
  wrapper.style.justifyContent = "center";
  wrapper.style.cursor = "pointer";

  wrapper.innerHTML = `
    <div
      style="
        width: 38px;
        height: 38px;
        border-radius: 9999px 9999px 9999px 6px;
        transform: rotate(-45deg);
        background: #0284c7;
        border: 3px solid white;
        box-shadow: 0 4px 14px rgba(15,23,42,.25);
        display: flex;
        align-items: center;
        justify-content: center;
      "
    >
      <div
        style="
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: white;
        "
      ></div>
    </div>
  `;

  if (verified) {
    wrapper.title = "نشاط موثق";
  }

  return wrapper;
}

export function createUserLocationElement() {
  const wrapper =
    document.createElement("div");

  wrapper.style.width = "24px";
  wrapper.style.height = "24px";
  wrapper.style.borderRadius = "9999px";
  wrapper.style.background = "#2563eb";
  wrapper.style.border = "4px solid white";
  wrapper.style.boxShadow =
    "0 2px 10px rgba(15,23,42,.25)";

  return wrapper;
}