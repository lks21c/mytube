export const contentType = "image/svg+xml";
export const size = { width: 512, height: 512 };

export default function Icon() {
  const isLocal = process.env.NEXT_PUBLIC_APP_ENV === "local";
  const color = isLocal ? "#22c55e" : "#ff0000";

  return new Response(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="${color}"/>
  <polygon points="192,128 192,384 400,256" fill="white"/>
</svg>`,
    { headers: { "Content-Type": "image/svg+xml" } },
  );
}
