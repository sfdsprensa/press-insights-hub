import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard de Gestión de Prensa" },
      { name: "description", content: "Dashboard ejecutivo para gestión de solicitudes de prensa y comunicaciones." },
    ],
  }),
  component: Index,
});

function Index() {
  useEffect(() => {
    window.location.replace("/prensa/index.html");
  }, []);
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Poppins, sans-serif", color: "#1857b6" }}>
      Cargando Dashboard de Prensa…
    </div>
  );
}
