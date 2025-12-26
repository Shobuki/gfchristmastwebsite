"use client";

import { useEffect, useMemo, useState } from "react";


type Picture = {
  id: number;
  originalName: string | null;
  createdAt: string;
  url: string;
  gachaId: number | null;
};

type JourneyItem = {
  id: number;
  category: "sweet" | "funny";
  title: string;
  caption: string;
  url: string | null;
};

type GachaItem = {
  id: number;
  rarity: "common" | "rare" | "epic" | "legendary" | "mythic";
  title: string;
  caption: string;
};

type CosmicSettings = {
  introTitle: string;
  introSubtitle: string;
  timelineTitle: string;
  date1: string;
  caption1: string;
  date2: string;
  caption2: string;
};

type LayoutSettings = {
  journeyColumns: number;
  gachaColumns: number;
};

type LetterSettings = {
  title: string;
  body1: string;
  body2: string;
  buttonText: string;
  footer: string;
};

type AdminUser = {
  id: number;
  username: string;
  createdAt: string;
};

type RaritySetting = {
  rarity: "common" | "rare" | "epic" | "legendary" | "mythic";
  weight: number;
};

const RARITY_ORDER: RaritySetting["rarity"][] = [
  "common",
  "rare",
  "epic",
  "legendary",
  "mythic",
];

const RARITY_DESCRIPTIONS: Record<RaritySetting["rarity"], string> = {
  common: "Foto jelek",
  rare: "Foto jeje ngasoy",
  epic: "Foto jeje cakeb",
  legendary: "Foto luar biasa jeje",
  mythic: "Foto bersama",
};

export default function AdminPage() {
  const [pictures, setPictures] = useState<Picture[]>([]);
  const [journeyItems, setJourneyItems] = useState<JourneyItem[]>([]);
  const [gachaItems, setGachaItems] = useState<GachaItem[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [raritySettings, setRaritySettings] = useState<RaritySetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [pendingGachaMeta, setPendingGachaMeta] = useState<
    Record<
      number,
      { rarity?: RaritySetting["rarity"]; title: string; caption: string }
    >
  >({});
  const [pendingGachaAssign, setPendingGachaAssign] = useState<
    Record<number, RaritySetting["rarity"]>
  >({});
  const [activeTab, setActiveTab] = useState<
    "auto" | "gacha" | "journey" | "cosmic" | "layout" | "letter" | "admins"
  >("auto");
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [cosmicSettings, setCosmicSettings] = useState<CosmicSettings | null>(
    null,
  );
  const [layoutSettings, setLayoutSettings] = useState<LayoutSettings | null>(
    null,
  );
  const [letterSettings, setLetterSettings] = useState<LetterSettings | null>(
    null,
  );

  const authFetch = async (input: RequestInfo, init?: RequestInit) => {
    const token = adminToken || "";
    const headers = new Headers(init?.headers);
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    const response = await fetch(input, { ...init, headers });
    if (response.status === 401) {
      localStorage.removeItem("adminToken");
      window.location.href = "/admin/login";
      throw new Error("unauthorized");
    }
    return response;
  };

  const fetchPictures = async () => {
    try {
      const res = await authFetch("/api/pictures");
      const data = await res.json();
      setPictures(data.items || []);
    } finally {
      setLoading(false);
    }
  };

  const fetchJourneyItems = async () => {
    const res = await authFetch("/api/journey");
    const data = await res.json();
    setJourneyItems(data.items || []);
  };

  const fetchGachaItems = async () => {
    const res = await authFetch("/api/gacha-items");
    const data = await res.json();
    setGachaItems(data.items || []);
  };

  const fetchCosmicSettings = async () => {
    const res = await authFetch("/api/cosmic");
    const data = await res.json();
    if (data?.item) {
      setCosmicSettings({
        introTitle: data.item.intro_title,
        introSubtitle: data.item.intro_subtitle,
        timelineTitle: data.item.timeline_title,
        date1: data.item.date1,
        caption1: data.item.caption1,
        date2: data.item.date2,
        caption2: data.item.caption2,
      });
    }
  };

  const fetchLayoutSettings = async () => {
    const res = await authFetch("/api/layout");
    const data = await res.json();
    if (data?.item) {
      setLayoutSettings({
        journeyColumns: data.item.journey_columns,
        gachaColumns: data.item.gacha_columns,
      });
    }
  };

  const fetchLetterSettings = async () => {
    const res = await authFetch("/api/letter");
    const data = await res.json();
    if (data?.item) {
      setLetterSettings({
        title: data.item.title,
        body1: data.item.body1,
        body2: data.item.body2,
        buttonText: data.item.button_text,
        footer: data.item.footer,
      });
    }
  };

  const fetchAdmins = async () => {
    const res = await authFetch("/api/admins");
    const data = await res.json();
    setAdmins(data.items || []);
  };

  const fetchRaritySettings = async () => {
    const res = await authFetch("/api/gacha-rarity");
    const data = await res.json();
    const items = (data.items || []) as RaritySetting[];
    items.sort(
      (a, b) => RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity),
    );
    setRaritySettings(items);
  };

  useEffect(() => {
    const storedToken = localStorage.getItem("adminToken");
    if (!storedToken) {
      window.location.href = "/admin/login";
      return;
    }
    setAdminToken(storedToken);
  }, []);

  useEffect(() => {
    if (!adminToken) return;
    fetchPictures();
    fetchJourneyItems();
    fetchGachaItems();
    fetchCosmicSettings();
    fetchLayoutSettings();
    fetchLetterSettings();
    fetchAdmins();
    fetchRaritySettings();
  }, [adminToken]);

  useEffect(() => {
    if (activeTab !== "auto") return;
    const picturesInterval = setInterval(fetchPictures, 5000);
    return () => clearInterval(picturesInterval);
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "journey") fetchJourneyItems();
    if (activeTab === "gacha") fetchGachaItems();
    if (activeTab === "cosmic") fetchCosmicSettings();
    if (activeTab === "layout") fetchLayoutSettings();
    if (activeTab === "letter") fetchLetterSettings();
    if (activeTab === "admins") fetchAdmins();
    if (activeTab === "gacha") fetchRaritySettings();
  }, [activeTab]);

  const handleUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const gachaId = Number(form.dataset.gachaId || "");
    const input = form.elements.namedItem("file") as HTMLInputElement | null;
    if (!input?.files?.[0]) return;
    setUploadingId(gachaId);
    const formData = new FormData();
    formData.append("file", input.files[0]);
    formData.append("gachaId", String(gachaId));
    await authFetch("/api/pictures", { method: "POST", body: formData });
    input.value = "";
    setUploadingId(null);
    fetchPictures();
  };

  const handleBulkUpload = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    const form = event.currentTarget;
    const input = form.elements.namedItem("bulkFiles") as HTMLInputElement | null;
    if (!input?.files?.length) return;
    setUploadingId(-6);
    try {
      const uploads = Array.from(input.files).slice(0, 50);
      for (const file of uploads) {
        const renamedFile = new File(
          [file],
          `gacha-${Date.now()}-${file.name}`,
          {
            type: file.type,
          },
        );
        const formData = new FormData();
        formData.append("file", renamedFile);
        await authFetch("/api/pictures", { method: "POST", body: formData });
      }
    } finally {
      input.value = "";
      setUploadingId(null);
      fetchPictures();
    }
  };

  const handleGachaSave = async (
    event: React.FormEvent<HTMLFormElement>,
    id?: number,
  ) => {
    event.preventDefault();
    const form = event.currentTarget;
    const rarity = (form.elements.namedItem("rarity") as HTMLSelectElement | null)
      ?.value;
    const title = (form.elements.namedItem("title") as HTMLInputElement | null)
      ?.value;
    const caption = (
      form.elements.namedItem("caption") as HTMLTextAreaElement | null
    )?.value;
    if (!rarity || !title || !caption) return;
    setUploadingId(id ?? -2);
    await authFetch("/api/gacha-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, rarity, title, caption }),
    });
    setUploadingId(null);
    fetchGachaItems();
    form.reset();
  };

  const handleGachaDelete = async (id: number) => {
    await authFetch(`/api/gacha-items?id=${id}`, { method: "DELETE" });
    fetchGachaItems();
  };

  const handleAssignRarity = async (
    id: number,
    rarity: RaritySetting["rarity"],
  ) => {
    setUploadingId(id);
    await authFetch("/api/pictures/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, rarity }),
    });
    setUploadingId(null);
    fetchPictures();
  };

  const handleBulkAssign = async () => {
    if (!gachaPending.length) return;
    setUploadingId(-7);
    try {
      for (const pic of gachaPending) {
        const meta = pendingGachaMeta[pic.id];
        if (!meta) continue;
        const title = meta.title.trim();
        const caption = meta.caption.trim();
        if (!meta.rarity || !title || !caption) continue;
        const createRes = await authFetch("/api/gacha-items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rarity: meta.rarity,
            title,
            caption,
          }),
        });
        const created = await createRes.json();
        if (!created?.id) continue;
        await authFetch("/api/pictures/assign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: pic.id, gachaId: created.id }),
        });
      }
      setPendingGachaMeta({});
    } finally {
      setUploadingId(null);
      fetchPictures();
      fetchGachaItems();
    }
  };

  const autoCaptures = useMemo(
    () =>
      pictures.filter(
        (pic) =>
          pic.gachaId == null &&
          typeof pic.originalName === "string" &&
          pic.originalName.startsWith("capture-"),
      ),
    [pictures],
  );

  const gachaPending = useMemo(
    () =>
      pictures.filter(
        (pic) =>
          pic.gachaId == null &&
          (!pic.originalName || !pic.originalName.startsWith("capture-")),
      ),
    [pictures],
  );

  const gachaReadyCount = useMemo(
    () =>
      gachaPending.filter((pic) => {
        const meta = pendingGachaMeta[pic.id];
        return (
          meta?.rarity &&
          meta.title?.trim().length > 0 &&
          meta.caption?.trim().length > 0
        );
      }).length,
    [gachaPending, pendingGachaMeta],
  );

  const canSubmitGacha =
    gachaPending.length > 0 && gachaReadyCount === gachaPending.length;

  const handleJourneySave = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    const form = event.currentTarget;
    const id = Number(form.dataset.journeyId || "");
    const title = (form.elements.namedItem("title") as HTMLInputElement | null)
      ?.value;
    const caption = (
      form.elements.namedItem("caption") as HTMLTextAreaElement | null
    )?.value;
    const category = (
      form.elements.namedItem("category") as HTMLSelectElement | null
    )?.value;
    const fileInput = form.elements.namedItem("file") as HTMLInputElement | null;

    if (!id || !title || !caption || !category) return;
    setUploadingId(id);
    const formData = new FormData();
    formData.append("id", String(id));
    formData.append("title", title);
    formData.append("caption", caption);
    formData.append("category", category);
    if (fileInput?.files?.[0]) {
      formData.append("file", fileInput.files[0]);
    }

    await authFetch("/api/journey", { method: "POST", body: formData });
    setUploadingId(null);
    fetchJourneyItems();
  };

  const handleJourneyCreate = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    const form = event.currentTarget;
    const title = (form.elements.namedItem("title") as HTMLInputElement | null)
      ?.value;
    const caption = (
      form.elements.namedItem("caption") as HTMLTextAreaElement | null
    )?.value;
    const category = (
      form.elements.namedItem("category") as HTMLSelectElement | null
    )?.value;
    const fileInput = form.elements.namedItem("file") as HTMLInputElement | null;
    if (!title || !caption || !category) return;
    setUploadingId(-3);
    const formData = new FormData();
    formData.append("title", title);
    formData.append("caption", caption);
    formData.append("category", category);
    if (fileInput?.files?.[0]) {
      formData.append("file", fileInput.files[0]);
    }
    await authFetch("/api/journey", { method: "POST", body: formData });
    setUploadingId(null);
    fetchJourneyItems();
    form.reset();
  };

  const handleJourneyDelete = async (id: number) => {
    await authFetch(`/api/journey?id=${id}`, { method: "DELETE" });
    fetchJourneyItems();
  };

  const handleCosmicSave = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (!cosmicSettings) return;
    setUploadingId(0);
    await authFetch("/api/cosmic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cosmicSettings),
    });
    setUploadingId(null);
    fetchCosmicSettings();
  };

  const handleLayoutSave = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (!layoutSettings) return;
    setUploadingId(-1);
    await authFetch("/api/layout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(layoutSettings),
    });
    setUploadingId(null);
    fetchLayoutSettings();
  };

  const handleLetterSave = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (!letterSettings) return;
    setUploadingId(-8);
    await authFetch("/api/letter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(letterSettings),
    });
    setUploadingId(null);
    fetchLetterSettings();
  };

  const handleRaritySave = async (
    event: React.FormEvent<HTMLFormElement>,
    rarity: RaritySetting["rarity"],
  ) => {
    event.preventDefault();
    const form = event.currentTarget;
    const weightValue = (
      form.elements.namedItem("weight") as HTMLInputElement | null
    )?.value;
    const weight = Number(weightValue);
    if (!Number.isFinite(weight)) return;
    setUploadingId(-5);
    await authFetch("/api/gacha-rarity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rarity, weight }),
    });
    setUploadingId(null);
    fetchRaritySettings();
  };

  const handleAdminCreate = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    const form = event.currentTarget;
    const username = (
      form.elements.namedItem("username") as HTMLInputElement | null
    )?.value;
    const password = (
      form.elements.namedItem("password") as HTMLInputElement | null
    )?.value;
    if (!username || !password) return;
    setUploadingId(-4);
    await authFetch("/api/admins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    setUploadingId(null);
    fetchAdmins();
    form.reset();
  };

  const handleAdminDelete = async (id: number) => {
    await authFetch(`/api/admins?id=${id}`, { method: "DELETE" });
    fetchAdmins();
  };

  return (
    <main className="min-h-screen bg-[#0b0f1d] px-5 py-8 text-white">
      <header className="mb-6 rounded-3xl border border-white/10 bg-white/5 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">
              Admin Panel
            </p>
            <h1 className="text-2xl font-semibold">Picture Console</h1>
            <p className="mt-1 text-sm text-white/60">
              Auto refresh setiap 5 detik. Kelola auto capture atau upload
              gacha.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/30 p-1">
            <button
              type="button"
              onClick={() => setActiveTab("auto")}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                activeTab === "auto"
                  ? "bg-white text-[#0b0f1d]"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Auto Capture
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("gacha")}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                activeTab === "gacha"
                  ? "bg-white text-[#0b0f1d]"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Upload Gacha
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("journey")}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                activeTab === "journey"
                  ? "bg-white text-[#0b0f1d]"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Journey
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("cosmic")}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                activeTab === "cosmic"
                  ? "bg-white text-[#0b0f1d]"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Cosmic
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("layout")}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                activeTab === "layout"
                  ? "bg-white text-[#0b0f1d]"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Layout
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("letter")}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                activeTab === "letter"
                  ? "bg-white text-[#0b0f1d]"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Letter
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("admins")}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                activeTab === "admins"
                  ? "bg-white text-[#0b0f1d]"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Admins
            </button>
          </div>
        </div>
      </header>

      {!adminToken ? (
        <p className="text-sm text-white/60">Checking session...</p>
      ) : loading ? (
        <p className="text-sm text-white/60">Loading...</p>
      ) : (
        <div className="space-y-8">
          {activeTab === "auto" && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white/80">
                  Auto Capture (tanpa gacha)
                </h2>
                <span className="text-xs text-white/50">
                  Total: {autoCaptures.length}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {autoCaptures.map((pic) => (
                  <div
                    key={pic.id}
                    className="overflow-hidden rounded-2xl border border-white/10 bg-white/5"
                  >
                    <img src={pic.url} alt={pic.originalName || "picture"} />
                    <div className="p-2 text-[11px] text-white/60">
                      <div>#{pic.id}</div>
                      <div>{new Date(pic.createdAt).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeTab === "gacha" && (
            <section className="space-y-4">
              <h2 className="text-sm font-semibold text-white/80">
                Upload untuk setiap Gacha
              </h2>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white/80">
                      Bulk Upload
                    </h3>
                    <p className="text-xs text-white/50">
                      Upload sampai 50 foto, lalu pilih rarity satu per satu.
                    </p>
                  </div>
                </div>
                <form
                  onSubmit={handleBulkUpload}
                  className="flex flex-col gap-3 sm:flex-row sm:items-center"
                >
                  <input
                    type="file"
                    name="bulkFiles"
                    multiple
                    accept="image/*"
                    className="text-sm text-white/70"
                  />
                  <button
                    type="submit"
                    disabled={uploadingId === -6}
                    className="rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-[#0b0f1d] disabled:opacity-50"
                  >
                    {uploadingId === -6 ? "Uploading..." : "Upload Batch"}
                  </button>
                </form>
                {gachaPending.length > 0 && (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {gachaPending.map((pic) => (
                      <div
                        key={pic.id}
                        className="rounded-2xl border border-white/10 bg-black/30 p-3"
                      >
                        <div className="aspect-[4/3] overflow-hidden rounded-xl border border-white/10 bg-white/5">
                          <img
                            src={pic.url}
                            alt={pic.originalName || "pending"}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="mt-3 space-y-2">
                          <select
                            value={pendingGachaMeta[pic.id]?.rarity || ""}
                            className="w-full rounded-full border border-white/10 bg-black/40 px-3 py-2 text-xs text-white/80"
                            onChange={(event) => {
                              const value = event.target.value as RaritySetting["rarity"];
                              setPendingGachaMeta((prev) => ({
                                ...prev,
                                [pic.id]: {
                                  rarity: value,
                                  title: prev[pic.id]?.title || "",
                                  caption: prev[pic.id]?.caption || "",
                                },
                              }));
                            }}
                          >
                            <option value="" disabled>
                              Pilih rarity
                            </option>
                            {RARITY_ORDER.map((rarity) => (
                              <option key={rarity} value={rarity}>
                                {rarity}
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={pendingGachaMeta[pic.id]?.title || ""}
                            placeholder="Title"
                            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white/80"
                            onChange={(event) =>
                              setPendingGachaMeta((prev) => ({
                                ...prev,
                                [pic.id]: {
                                  rarity: prev[pic.id]?.rarity,
                                  title: event.target.value,
                                  caption: prev[pic.id]?.caption || "",
                                },
                              }))
                            }
                          />
                          <textarea
                            rows={2}
                            value={pendingGachaMeta[pic.id]?.caption || ""}
                            placeholder="Caption"
                            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white/80"
                            onChange={(event) =>
                              setPendingGachaMeta((prev) => ({
                                ...prev,
                                [pic.id]: {
                                  rarity: prev[pic.id]?.rarity,
                                  title: prev[pic.id]?.title || "",
                                  caption: event.target.value,
                                },
                              }))
                            }
                          />
                          {pendingGachaMeta[pic.id]?.rarity &&
                            pendingGachaMeta[pic.id]?.title?.trim() &&
                            pendingGachaMeta[pic.id]?.caption?.trim() && (
                              <span className="text-[11px] text-white/50">
                                Ready
                              </span>
                            )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {gachaPending.length > 0 && (
                  <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-white/60">
                    <span>
                      Lengkap: {gachaReadyCount}/{gachaPending.length}
                    </span>
                    <button
                      type="button"
                      onClick={handleBulkAssign}
                      disabled={uploadingId === -7 || !canSubmitGacha}
                      className="rounded-full bg-white/80 px-4 py-2 text-xs font-semibold text-[#0b0f1d] disabled:opacity-50"
                    >
                      {uploadingId === -7
                        ? "Assigning..."
                        : "Submit Assign"}
                    </button>
                  </div>
                )}
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white/80">
                    Rarity Percentage
                  </h3>
                  <p className="text-xs text-white/50">
                    Semakin besar angka, makin sering muncul.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {raritySettings.map((item) => (
                    <form
                      key={item.rarity}
                      onSubmit={(event) => handleRaritySave(event, item.rarity)}
                      className="rounded-2xl border border-white/10 bg-black/30 p-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-white/50">
                            {item.rarity}
                          </p>
                          <p className="text-xs text-white/70">
                            {RARITY_DESCRIPTIONS[item.rarity]}
                          </p>
                        </div>
                        <span className="text-xs text-white/50">%</span>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <input
                          type="number"
                          name="weight"
                          min={0}
                          defaultValue={item.weight}
                          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white/80"
                        />
                        <button
                          type="submit"
                          disabled={uploadingId === -5}
                          className="rounded-full bg-white/80 px-3 py-2 text-xs font-semibold text-[#0b0f1d] disabled:opacity-50"
                        >
                          {uploadingId === -5 ? "Saving..." : "Save"}
                        </button>
                      </div>
                    </form>
                  ))}
                </div>
              </div>
              <form
                onSubmit={(event) => handleGachaSave(event)}
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <div className="grid gap-3 sm:grid-cols-3">
                  <input
                    type="text"
                    name="title"
                    placeholder="Title"
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80"
                  />
                  <select
                    name="rarity"
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80"
                    defaultValue="common"
                  >
                    <option value="common">Common</option>
                    <option value="rare">Rare</option>
                    <option value="epic">Epic</option>
                    <option value="legendary">Legendary</option>
                    <option value="mythic">Mythic</option>
                  </select>
                  <button
                    type="submit"
                    disabled={uploadingId === -2}
                    className="rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-[#0b0f1d] disabled:opacity-50"
                  >
                    {uploadingId === -2 ? "Saving..." : "Add Gacha Item"}
                  </button>
                </div>
                <textarea
                  name="caption"
                  placeholder="Caption"
                  rows={2}
                  className="mt-3 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80"
                />
              </form>

              <div className="grid gap-4 lg:grid-cols-2">
                {gachaItems.map((item) => {
                  const itemId = Number(item.id);
                  const itemPics = pictures.filter(
                    (pic) => pic.gachaId === itemId,
                  );
                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-white/10 bg-white/5 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-white/50">
                            {item.rarity}
                          </p>
                          <h3 className="text-lg font-semibold">
                            {item.title}
                          </h3>
                          <p className="text-xs text-white/60">
                            {item.caption}
                          </p>
                        </div>
                        <span className="text-xs text-white/60">
                          ID {item.id}
                        </span>
                      </div>

                      <form
                        onSubmit={(event) => handleGachaSave(event, item.id)}
                        className="mt-3 grid gap-2"
                      >
                        <input
                          type="text"
                          name="title"
                          defaultValue={item.title}
                          className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80"
                        />
                        <textarea
                          name="caption"
                          defaultValue={item.caption}
                          rows={2}
                          className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80"
                        />
                        <div className="flex items-center gap-2">
                          <select
                            name="rarity"
                            defaultValue={item.rarity}
                            className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-white"
                          >
                            <option value="common">Common</option>
                            <option value="rare">Rare</option>
                            <option value="epic">Epic</option>
                            <option value="legendary">Legendary</option>
                            <option value="mythic">Mythic</option>
                          </select>
                          <button
                            type="submit"
                            disabled={uploadingId === item.id}
                            className="rounded-full bg-white/80 px-4 py-2 text-xs font-semibold text-[#0b0f1d] disabled:opacity-50"
                          >
                            {uploadingId === item.id ? "Saving..." : "Save"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleGachaDelete(item.id)}
                            className="rounded-full border border-white/20 px-4 py-2 text-xs text-white/70"
                          >
                            Delete
                          </button>
                        </div>
                      </form>

                      <form
                        data-gacha-id={item.id}
                        onSubmit={handleUpload}
                        className="mt-3 flex flex-col gap-2"
                      >
                        <input
                          type="file"
                          name="file"
                          accept="image/*"
                          className="text-sm text-white/70"
                        />
                        <button
                          type="submit"
                          disabled={uploadingId === item.id}
                          className="rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-[#0b0f1d] disabled:opacity-50"
                        >
                          {uploadingId === item.id ? "Uploading..." : "Upload"}
                        </button>
                      </form>

                      {itemPics.length > 0 && (
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          {itemPics.map((pic) => (
                            <div
                              key={pic.id}
                              className="overflow-hidden rounded-xl border border-white/10 bg-white/5"
                            >
                              <img src={pic.url} alt={pic.originalName || ""} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {activeTab === "journey" && (
            <section className="space-y-4">
              <h2 className="text-sm font-semibold text-white/80">
                Upload & Edit Journey
              </h2>
              <form
                onSubmit={handleJourneyCreate}
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <div className="grid gap-3 sm:grid-cols-3">
                  <input
                    type="text"
                    name="title"
                    placeholder="Title"
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80"
                  />
                  <select
                    name="category"
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80"
                    defaultValue="sweet"
                  >
                    <option value="sweet">Sweet</option>
                    <option value="funny">Funny</option>
                  </select>
                  <button
                    type="submit"
                    disabled={uploadingId === -3}
                    className="rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-[#0b0f1d] disabled:opacity-50"
                  >
                    {uploadingId === -3 ? "Saving..." : "Add Journey Item"}
                  </button>
                </div>
                <textarea
                  name="caption"
                  placeholder="Caption"
                  rows={2}
                  className="mt-3 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80"
                />
                <input
                  type="file"
                  name="file"
                  accept="image/*"
                  className="mt-3 text-sm text-white/70"
                />
              </form>
              <div className="grid gap-4 lg:grid-cols-2">
                {journeyItems.map((item) => (
                  <form
                    key={item.id}
                    data-journey-id={item.id}
                    onSubmit={handleJourneySave}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-white/50">
                          #{item.id}
                        </p>
                        <h3 className="text-lg font-semibold">{item.title}</h3>
                      </div>
                      <select
                        name="category"
                        defaultValue={item.category}
                        className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-white"
                      >
                        <option value="sweet">Sweet</option>
                        <option value="funny">Funny</option>
                      </select>
                    </div>

                    <div className="mt-3 space-y-2">
                      <input
                        type="text"
                        name="title"
                        defaultValue={item.title}
                        className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80"
                      />
                      <textarea
                        name="caption"
                        defaultValue={item.caption}
                        rows={3}
                        className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80"
                      />
                      <input
                        type="file"
                        name="file"
                        accept="image/*"
                        className="text-sm text-white/70"
                      />
                      <button
                        type="submit"
                        disabled={uploadingId === item.id}
                        className="rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-[#0b0f1d] disabled:opacity-50"
                      >
                        {uploadingId === item.id ? "Saving..." : "Save"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleJourneyDelete(item.id)}
                        className="rounded-full border border-white/20 px-4 py-2 text-xs text-white/70"
                      >
                        Delete
                      </button>
                    </div>

                    {item.url && (
                      <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-white/5">
                        <img src={item.url} alt={item.title} />
                      </div>
                    )}
                  </form>
                ))}
              </div>
            </section>
          )}

          {activeTab === "cosmic" && cosmicSettings && (
            <section className="space-y-4">
              <h2 className="text-sm font-semibold text-white/80">
                Cosmic Timeline Settings
              </h2>
              <form
                onSubmit={handleCosmicSave}
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <div className="grid gap-3">
                  <input
                    type="text"
                    value={cosmicSettings.introTitle}
                    onChange={(event) =>
                      setCosmicSettings({
                        ...cosmicSettings,
                        introTitle: event.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80"
                    placeholder="Intro title"
                  />
                  <textarea
                    value={cosmicSettings.introSubtitle}
                    onChange={(event) =>
                      setCosmicSettings({
                        ...cosmicSettings,
                        introSubtitle: event.target.value,
                      })
                    }
                    rows={2}
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80"
                    placeholder="Intro subtitle"
                  />
                  <input
                    type="text"
                    value={cosmicSettings.timelineTitle}
                    onChange={(event) =>
                      setCosmicSettings({
                        ...cosmicSettings,
                        timelineTitle: event.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80"
                    placeholder="Timeline title"
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      type="date"
                      value={cosmicSettings.date1}
                      onChange={(event) =>
                        setCosmicSettings({
                          ...cosmicSettings,
                          date1: event.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80"
                    />
                    <input
                      type="date"
                      value={cosmicSettings.date2}
                      onChange={(event) =>
                        setCosmicSettings({
                          ...cosmicSettings,
                          date2: event.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80"
                    />
                  </div>
                  <textarea
                    value={cosmicSettings.caption1}
                    onChange={(event) =>
                      setCosmicSettings({
                        ...cosmicSettings,
                        caption1: event.target.value,
                      })
                    }
                    rows={3}
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80"
                    placeholder="Caption date 1"
                  />
                  <textarea
                    value={cosmicSettings.caption2}
                    onChange={(event) =>
                      setCosmicSettings({
                        ...cosmicSettings,
                        caption2: event.target.value,
                      })
                    }
                    rows={3}
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80"
                    placeholder="Caption date 2"
                  />
                </div>
                <button
                  type="submit"
                  disabled={uploadingId === 0}
                  className="mt-3 rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-[#0b0f1d] disabled:opacity-50"
                >
                  {uploadingId === 0 ? "Saving..." : "Save"}
                </button>
              </form>
            </section>
          )}

          {activeTab === "layout" && layoutSettings && (
            <section className="space-y-4">
              <h2 className="text-sm font-semibold text-white/80">
                Layout Settings
              </h2>
              <form
                onSubmit={handleLayoutSave}
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-2 text-xs text-white/60">
                    Journey columns
                    <input
                      type="number"
                      min={1}
                      max={4}
                      value={layoutSettings.journeyColumns}
                      onChange={(event) =>
                        setLayoutSettings({
                          ...layoutSettings,
                          journeyColumns: Number(event.target.value || 1),
                        })
                      }
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80"
                    />
                  </label>
                  <label className="space-y-2 text-xs text-white/60">
                    Gacha columns
                    <input
                      type="number"
                      min={1}
                      max={4}
                      value={layoutSettings.gachaColumns}
                      onChange={(event) =>
                        setLayoutSettings({
                          ...layoutSettings,
                          gachaColumns: Number(event.target.value || 1),
                        })
                      }
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80"
                    />
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={uploadingId === -1}
                  className="mt-3 rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-[#0b0f1d] disabled:opacity-50"
                >
                  {uploadingId === -1 ? "Saving..." : "Save"}
                </button>
              </form>
            </section>
          )}

          {activeTab === "letter" && letterSettings && (
            <section className="space-y-4">
              <h2 className="text-sm font-semibold text-white/80">
                Letter Settings
              </h2>
              <form
                onSubmit={handleLetterSave}
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <div className="grid gap-3">
                  <input
                    type="text"
                    value={letterSettings.title}
                    onChange={(event) =>
                      setLetterSettings({
                        ...letterSettings,
                        title: event.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80"
                    placeholder="Letter title"
                  />
                  <textarea
                    value={letterSettings.body1}
                    onChange={(event) =>
                      setLetterSettings({
                        ...letterSettings,
                        body1: event.target.value,
                      })
                    }
                    rows={4}
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80"
                    placeholder="Paragraph 1"
                  />
                  <textarea
                    value={letterSettings.body2}
                    onChange={(event) =>
                      setLetterSettings({
                        ...letterSettings,
                        body2: event.target.value,
                      })
                    }
                    rows={4}
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80"
                    placeholder="Paragraph 2"
                  />
                  <input
                    type="text"
                    value={letterSettings.buttonText}
                    onChange={(event) =>
                      setLetterSettings({
                        ...letterSettings,
                        buttonText: event.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80"
                    placeholder="Button text"
                  />
                  <input
                    type="text"
                    value={letterSettings.footer}
                    onChange={(event) =>
                      setLetterSettings({
                        ...letterSettings,
                        footer: event.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80"
                    placeholder="Footer text"
                  />
                </div>
                <button
                  type="submit"
                  disabled={uploadingId === -8}
                  className="mt-3 rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-[#0b0f1d] disabled:opacity-50"
                >
                  {uploadingId === -8 ? "Saving..." : "Save"}
                </button>
              </form>
            </section>
          )}

          {activeTab === "admins" && (
            <section className="space-y-4">
              <h2 className="text-sm font-semibold text-white/80">
                Admin Management
              </h2>
              <form
                onSubmit={handleAdminCreate}
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <div className="grid gap-3 sm:grid-cols-3">
                  <input
                    type="text"
                    name="username"
                    placeholder="Username"
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80"
                  />
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80"
                  />
                  <button
                    type="submit"
                    disabled={uploadingId === -4}
                    className="rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-[#0b0f1d] disabled:opacity-50"
                  >
                    {uploadingId === -4 ? "Saving..." : "Add Admin"}
                  </button>
                </div>
              </form>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {admins.map((admin) => (
                  <div
                    key={admin.id}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-white/50">
                          #{admin.id}
                        </p>
                        <h3 className="text-lg font-semibold">
                          {admin.username}
                        </h3>
                        <p className="text-xs text-white/60">
                          {new Date(admin.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAdminDelete(admin.id)}
                        className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/70"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </main>
  );
}
