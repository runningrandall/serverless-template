"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Script from "next/script";
import {
  GoogleReCaptchaProvider,
  useGoogleReCaptcha,
} from "react-google-recaptcha-v3";
import LocationPicker from "../components/LocationPicker";
import PhotoUploader from "../components/PhotoUploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Loader2, CheckCircle2 } from "lucide-react";

const CONCERN_TYPES = [
  "Visible sediment / turbidity",
  "Erosion / exposed soil",
  "Illicit discharge / pollution",
  "Runoff from construction area",
  "Stormwater controls failing",
  "Other",
] as const;

const RECAPTCHA_SITE_KEY =
  process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "";

function ReportForm() {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [concernType, setConcernType] = useState("");
  const [description, setDescription] = useState("");
  const [dateObserved, setDateObserved] = useState("");
  const [timeObserved, setTimeObserved] = useState("");
  const [location, setLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const { executeRecaptcha } = useGoogleReCaptcha();

  const GOOGLE_MAPS_API_KEY =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";


  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      console.warn("Google Maps API Key is missing!");
    }
  }, [GOOGLE_MAPS_API_KEY]);

  const getUploadUrl = async (contentType: string) => {
    const res = await fetch(
      `${API_URL}/upload-url?contentType=${encodeURIComponent(contentType)}`
    );
    if (!res.ok) throw new Error("Failed to get upload URL");
    return res.json();
  };

  const uploadImage = async (url: string, file: File) => {
    const res = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!res.ok) throw new Error("Failed to upload image");
  };

  const createReport = async (
    reportData: {
      name: string;
      contact: string;
      concernType: string;
      description: string;
      dateObserved: string;
      timeObserved: string;
      location: { lat: number; lng: number };
      imageKeys: string[];
      captchaToken: string | null;
    }
  ) => {
    const res = await fetch(`${API_URL}/reports`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reportData),
    });
    if (!res.ok) throw new Error("Failed to create report");
    return res.json();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !concernType || !location || imageFiles.length === 0) {
      alert(
        "Please fill in all required fields (Name, Type of Concern, at least one Photo, Location)"
      );
      return;
    }

    // Get reCAPTCHA v3 token
    let captchaToken: string | null = null;
    if (RECAPTCHA_SITE_KEY && executeRecaptcha) {
      try {
        captchaToken = await executeRecaptcha('submit_report');
      } catch {
        alert("CAPTCHA verification failed. Please try again.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // Upload all images
      const imageKeys: string[] = [];
      for (const file of imageFiles) {
        const { uploadUrl, key } = await getUploadUrl(file.type);
        await uploadImage(uploadUrl, file);
        imageKeys.push(key);
      }

      // Submit report
      await createReport({
        name,
        contact,
        concernType,
        description,
        dateObserved,
        timeObserved,
        location,
        imageKeys,
        captchaToken,
      });

      setSuccess(true);
      // Reset
      setName("");
      setContact("");
      setConcernType("");
      setDescription("");
      setDateObserved("");
      setTimeObserved("");
      setLocation(null);
      setImageFiles([]);
      // reCAPTCHA v3 token is obtained fresh each submit, no reset needed
    } catch (error) {
      console.error(error);
      alert(
        "Failed to submit report. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLocationSelect = useCallback(
    (loc: { lat: number; lng: number }) => setLocation(loc),
    []
  );

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-primary/30">
          <CardHeader className="text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-500 mb-2" />
            <CardTitle className="text-green-400">
              Report Submitted!
            </CardTitle>
            <CardDescription>
              Thank you for reporting the storm water concern. Our team will
              review it shortly.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full bg-primary hover:bg-primary/90"
              onClick={() => setSuccess(false)}
            >
              Submit Another Report
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 flex flex-col items-center">
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`}
        strategy="afterInteractive"
      />

      {/* Header */}
      <div className="w-full max-w-lg text-center mb-6 mt-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          S&L Construction
        </h1>
        <div className="h-1 w-16 bg-primary mx-auto mt-2 rounded-full" />
        <p className="mt-2 text-sm text-muted-foreground">
          Storm Water Concern Reporting
        </p>
      </div>

      <Card className="w-full max-w-lg border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Report a Concern</CardTitle>
          <CardDescription>
            Fill out the form below to report a storm water issue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your Name"
                required
              />
            </div>

            {/* Contact */}
            <div className="space-y-2">
              <Label htmlFor="contact">Contact Info (Optional)</Label>
              <Input
                id="contact"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="Phone or Email"
              />
            </div>

            {/* Type of Concern */}
            <div className="space-y-2">
              <Label htmlFor="concernType">Type of Concern *</Label>
              <select
                id="concernType"
                value={concernType}
                onChange={(e) => setConcernType(e.target.value)}
                required
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Select</option>
                {CONCERN_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the concern in detail..."
                rows={3}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
              />
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="dateObserved">Date Observed</Label>
                <Input
                  id="dateObserved"
                  type="date"
                  value={dateObserved}
                  onChange={(e) => setDateObserved(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timeObserved">Time Observed</Label>
                <Input
                  id="timeObserved"
                  type="time"
                  value={timeObserved}
                  onChange={(e) => setTimeObserved(e.target.value)}
                />
              </div>
            </div>

            {/* Photos */}
            <div className="space-y-2">
              <Label>Photos *</Label>
              <PhotoUploader
                files={imageFiles}
                onFilesChange={setImageFiles}
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label>Location *</Label>
              {GOOGLE_MAPS_API_KEY ? (
                <LocationPicker
                  onLocationSelect={handleLocationSelect}
                  initialLocation={location || undefined}
                />
              ) : (
                <div className="p-4 bg-yellow-900/30 text-yellow-300 rounded text-sm border border-yellow-700/50">
                  Google Maps API Key missing. Please configure
                  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.
                </div>
              )}
              {location && (
                <p className="text-xs text-muted-foreground">
                  Lat: {location.lat.toFixed(6)}, Lng:{" "}
                  {location.lng.toFixed(6)}
                </p>
              )}
            </div>

            {/* reCAPTCHA v3 is invisible — no UI widget needed */}

            {/* Submit */}
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Report"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="mt-8 mb-4 text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} S&L Construction &mdash;{" "}
        <a
          href="https://sandlinc.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          sandlinc.com
        </a>
      </div>
    </div>
  );
}

export default function Home() {
  if (!RECAPTCHA_SITE_KEY) {
    return <ReportForm />;
  }
  return (
    <GoogleReCaptchaProvider reCaptchaKey={RECAPTCHA_SITE_KEY}>
      <ReportForm />
    </GoogleReCaptchaProvider>
  );
}
