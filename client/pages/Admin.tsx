import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CreateDonorResponse,
  Donor,
  GetDonorsResponse,
  Member,
  GetMembersResponse,
} from "@shared/api";
import { FormEvent, useEffect, useState } from "react";
import { apiGet } from "@/lib/api";

export default function Admin() {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("adminToken"),
  );
  const [email, setEmail] = useState<string>(
    (import.meta as any).env.VITE_ADMIN_EMAIL || "karunasetu@gmail.com",
  );
  const [password, setPassword] = useState<string>(
    (import.meta as any).env.VITE_ADMIN_PASSWORD || "NGOcraze@25",
  );

  const [activeTab, setActiveTab] = useState<"images" | "donors" | "members">(
    "images",
  );
  const [title, setTitle] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [donorLogo, setDonorLogo] = useState<File | null>(null);
  const [memberPhoto, setMemberPhoto] = useState<File | null>(null);
  const qc = useQueryClient();
  const donorsQuery = useQuery<GetDonorsResponse>({
    queryKey: ["donors"],
    queryFn: async () => apiGet("/api/donors", { donors: [] }),
  });
  const membersQuery = useQuery<GetMembersResponse>({
    queryKey: ["members"],
    queryFn: async () => apiGet("/api/members", { members: [] }),
  });

  useEffect(() => {
    if (token) localStorage.setItem("adminToken", token);
    else localStorage.removeItem("adminToken");
  }, [token]);

  // compatibility helper for react-query mutation loading state across versions
  function isMutating(m: any) {
    return !!(
      m &&
      ((m as any).isLoading ??
        (m as any).isPending ??
        (m as any).state?.status === "loading")
    );
  }

  // Login
  const loginMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error("Login failed");
      return await res.json();
    },
    onSuccess: (data: { token: string }) => {
      setToken(data.token);
      alert("Logged in");
    },
  });

  // Upload images
  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!files || files.length === 0) throw new Error("No files");
      const fd = new FormData();
      fd.append("title", title || "Donation");
      Array.from(files).forEach((f) => fd.append("images", f));
      const res = await fetch("/api/gallery/admin", {
        method: "POST",
        body: fd,
        headers: { Authorization: `Bearer ${token || ""}` },
      });
      if (!res.ok) throw new Error("Upload failed");
      return (await res.json()) as { images: { title: string; url: string }[] };
    },
    onSuccess: () => {
      setTitle("");
      setFiles(null);
      const input = document.getElementById(
        "multi-images",
      ) as HTMLInputElement | null;
      if (input) input.value = "";
      qc.invalidateQueries({ queryKey: ["gallery"] });
      alert("Images uploaded");
    },
  });

  // Gallery list + delete
  const galleryQuery = useQuery<{
    images: { _id?: string; title: string; url: string }[];
  }>({
    queryKey: ["gallery"],
    queryFn: async () => apiGet("/api/gallery", { images: [] }),
  });

  const deleteGalleryMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/gallery/admin/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token || ""}` },
      });
      if (!res.ok) throw new Error("Failed");
      return await res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gallery"] }),
  });

  // Add donor (with optional logo file)
  const addDonorMutation = useMutation({
    mutationFn: async (d: {
      name: string;
      tier: Donor["tier"];
      website?: string;
      donatedAmount?: number;
      donatedCommodity?: string;
    }) => {
      const fd = new FormData();
      fd.append("name", d.name);
      fd.append("tier", d.tier);
      if (d.website) fd.append("website", d.website);
      if (d.donatedAmount) fd.append("donatedAmount", String(d.donatedAmount));
      if (d.donatedCommodity) fd.append("donatedCommodity", d.donatedCommodity);
      if (donorLogo) fd.append("logo", donorLogo);

      const res = await fetch("/api/donors/admin", {
        method: "POST",
        body: fd,
        headers: { Authorization: `Bearer ${token || ""}` },
      });
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as CreateDonorResponse;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["donors"] });
      setDonorLogo(null);
      const input = document.getElementById(
        "donor-logo",
      ) as HTMLInputElement | null;
      if (input) input.value = "";
    },
  });

  const deleteDonorMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/donors/admin/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token || ""}` },
      });
      if (!res.ok) throw new Error("Failed");
      return await res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["donors"] }),
  });

  // Members mutations
  const addMemberMutation = useMutation({
    mutationFn: async (m: {
      name: string;
      role: string;
      bio?: string;
      instaId?: string;
      email?: string;
      contact?: string;
    }) => {
      const fd = new FormData();
      fd.append("name", m.name);
      fd.append("role", m.role);
      if (m.bio) fd.append("bio", m.bio);
      if (m.instaId) fd.append("instaId", m.instaId);
      if (m.email) fd.append("email", m.email);
      if (m.contact) fd.append("contact", m.contact);
      if (memberPhoto) fd.append("photo", memberPhoto);


      const res = await fetch("/api/members/admin", {
        method: "POST",
        body: fd,
        headers: { Authorization: `Bearer ${token || ""}` },
      });
      if (!res.ok) throw new Error("Failed");
      return await res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["members"] });
      const input = document.getElementById(
        "member-photo",
      ) as HTMLInputElement | null;
      if (input) input.value = "";
    },
  });

  const deleteMemberMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/members/admin/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token || ""}` },
      });
      if (!res.ok) throw new Error("Failed");
      return await res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["members"] }),
  });

  function onAddDonor(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    addDonorMutation.mutate({
      name: String(formData.get("name") || "").trim(),
      tier: (String(formData.get("tier") || "Gold") as Donor["tier"]) || "Gold",
      website: String(formData.get("website") || "").trim() || undefined,
      donatedAmount: formData.get("donatedAmount")
        ? Number(formData.get("donatedAmount"))
        : undefined,
      donatedCommodity:
        String(formData.get("donatedCommodity") || "").trim() || undefined,
    });
    form.reset();
  }

  if (!token) {
    return (
      <section className="container py-12 md:py-16">
        <h1 className="text-3xl font-bold">Admin Login</h1>
        <p className="text-muted-foreground mt-2">
          Sign in with your admin credentials.
        </p>
        <div className="mt-6 w-full max-w-md">
          <input
            className="w-full rounded-md border px-3 py-2 mb-3"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="w-full rounded-md border px-3 py-2 mb-3"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="flex gap-3">
            <button
              className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
              onClick={() => loginMutation.mutate()}
              disabled={isMutating(loginMutation)}
            >
              Login
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="container py-12 md:py-16">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <div>
          <button
            className="mr-3 rounded-md border px-3 py-2"
            onClick={() => {
              setToken(null);
              alert("Logged out");
            }}
          >
            Logout
          </button>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex gap-3">
          <button
            className={`px-4 py-2 rounded ${activeTab === "images" ? "bg-primary text-primary-foreground" : "border"}`}
            onClick={() => setActiveTab("images")}
          >
            Image Uploads
          </button>
          <button
            className={`px-4 py-2 rounded ${activeTab === "donors" ? "bg-primary text-primary-foreground" : "border"}`}
            onClick={() => setActiveTab("donors")}
          >
            Donors
          </button>
          <button
            className={`px-4 py-2 rounded ${activeTab === "members" ? "bg-primary text-primary-foreground" : "border"}`}
            onClick={() => setActiveTab("members")}
          >
            Members
          </button>
        </div>

        {activeTab === "images" && (
          <div className="mt-6 rounded-xl border p-6">
            <h2 className="font-semibold">Upload Images</h2>
            <div className="mt-3 space-y-3">
              <input
                type="text"
                placeholder="Title for all images (optional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-md border px-3 py-2"
              />
              <input
                id="multi-images"
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setFiles(e.target.files)}
              />
              <div className="flex gap-3 mt-2">
                <button
                  className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground shadow"
                  onClick={() => uploadMutation.mutate()}
                  disabled={
                    !files || files.length === 0 || isMutating(uploadMutation)
                  }
                >
                  {isMutating(uploadMutation)
                    ? "Uploading..."
                    : "Upload Images"}
                </button>
              </div>

              {/* Existing images */}
              <div className="mt-6">
                <h3 className="font-medium mb-3">Gallery Images</h3>
                {galleryQuery.data?.images?.length === 0 && (
                  <div className="text-muted-foreground">No images yet.</div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  {(galleryQuery.data?.images || []).map((img) => (
                    <div
                      key={img._id || img.url}
                      className="rounded overflow-hidden border"
                    >
                      <img
                        src={img.url}
                        className="w-full h-40 object-cover"
                        alt={img.title}
                      />
                      <div className="p-2 flex items-center justify-between">
                        <div className="text-sm">{img.title}</div>
                        <button
                          className="text-sm text-destructive"
                          onClick={() =>
                            img._id && deleteGalleryMutation.mutate(img._id)
                          }
                          disabled={isMutating(deleteGalleryMutation)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "donors" && (
          <div className="mt-6 rounded-xl border p-6">
            <h2 className="font-semibold">Add Donor</h2>
            <form className="mt-4 grid gap-3" onSubmit={onAddDonor}>
              <input
                name="name"
                required
                placeholder="Donor name"
                className="rounded-md border px-3 py-2"
              />
              <select name="tier" className="rounded-md border px-3 py-2">
                <option>Platinum</option>
                <option>Gold</option>
                <option>Silver</option>
                <option>Bronze</option>
              </select>
              <input
                id="donor-logo"
                name="logo"
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setDonorLogo(
                    e.currentTarget.files ? e.currentTarget.files[0] : null,
                  )
                }
              />
              <input
                name="website"
                placeholder="Website (optional)"
                className="rounded-md border px-3 py-2"
              />
              <input
                name="donatedAmount"
                placeholder="Donated Amount (₹)"
                type="number"
                className="rounded-md border px-3 py-2"
              />
              <input
                name="donatedCommodity"
                placeholder="Donated Commodity (optional)"
                className="rounded-md border px-3 py-2"
              />
              <button
                className="inline-flex w-fit items-center rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground shadow"
                disabled={isMutating(addDonorMutation)}
              >
                {isMutating(addDonorMutation) ? "Adding..." : "Add Donor"}
              </button>
            </form>

            <div className="mt-6 divide-y">
              {(donorsQuery.data?.donors || []).map((d) => (
                <div
                  key={d._id}
                  className="flex items-center justify-between py-3"
                >
                  <div>
                    <div className="font-medium">{d.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {d.tier} {d.donatedAmount ? `• ₹${d.donatedAmount}` : ""}{" "}
                      {d.donatedCommodity ? `• ${d.donatedCommodity}` : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {d.logoUrl && (
                      <img
                        src={d.logoUrl}
                        className="h-10 w-10 object-cover rounded-full"
                      />
                    )}
                    <button
                      className="text-sm text-destructive hover:underline"
                      onClick={() => d._id && deleteDonorMutation.mutate(d._id)}
                      disabled={isMutating(deleteDonorMutation)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "members" && (
          <div className="mt-6 rounded-xl border p-6">
            <h2 className="font-semibold">Add Member</h2>
            <form
              className="mt-4 grid gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget as HTMLFormElement;
                const fd = new FormData(form);
                addMemberMutation.mutate({
                  name: String(fd.get("name") || "").trim(),
                  role: String(fd.get("role") || "Core"),
                  bio: String(fd.get("bio") || ""),
                  instaId: String(fd.get("instaId") || "").trim() || undefined,
                  email: String(fd.get("email") || "").trim() || undefined,
                  contact: String(fd.get("contact") || "").trim() || undefined,
                });
                form.reset();
              }}
            >
              <input
                name="name"
                required
                placeholder="Full name"
                className="rounded-md border px-3 py-2"
              />
              <select name="role" className="rounded-md border px-3 py-2">
                <option>Founder</option>
                <option>Partner</option>
                <option>Core</option>
              </select>
              <input
                id="member-photo"
                name="photo"
                type="file"
                accept="image/*"
                onChange={(e) =>setMemberPhoto(e.currentTarget.files ? e.currentTarget.files[0] : null)
                }
              />
              <input
                name="instaId"
                placeholder="Instagram handle (optional)"
                className="rounded-md border px-3 py-2"
              />
              <input
                name="email"
                placeholder="Email (optional)"
                className="rounded-md border px-3 py-2"
              />
              <input
                name="contact"
                placeholder="Contact number (optional)"
                className="rounded-md border px-3 py-2"
              />
              <textarea
                name="bio"
                placeholder="Short bio (optional)"
                className="rounded-md border px-3 py-2"
              />
              <button
                className="inline-flex w-fit items-center rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground shadow"
                disabled={isMutating(addMemberMutation)}
              >
                {isMutating(addMemberMutation) ? "Adding..." : "Add Member"}
              </button>
            </form>

            <div className="mt-6 divide-y">
              {(membersQuery.data?.members || []).map((m) => (
                <div
                  key={m._id}
                  className="flex items-center justify-between py-3"
                >
                  <div>
                    <div className="font-medium">
                      {m.name}{" "}
                      <span className="text-xs text-muted-foreground">
                        • {m.role}
                      </span>
                    </div>
                    {m.bio && (
                      <div className="text-xs text-muted-foreground">
                        {m.bio}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      {m.instaId ? `@${m.instaId}` : ""}{" "}
                      {m.email ? `• ${m.email}` : ""}{" "}
                      {m.contact ? `• ${m.contact}` : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {m.photoUrl && (
                      <img
                        src={m.photoUrl}
                        className="h-10 w-10 object-cover rounded-full"
                      />
                    )}
                    <button
                      className="text-sm text-destructive hover:underline"
                      onClick={() =>
                        m._id && deleteMemberMutation.mutate(m._id)
                      }
                      disabled={isMutating(deleteMemberMutation)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
