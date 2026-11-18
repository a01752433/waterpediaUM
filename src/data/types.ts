export type NwqsClass = "I" | "II" | "III" | "IV" | "V";

export type Trend = "improving" | "worsening" | "stable";

export type WaterBody = "UM Green Belt wetland" | "Varsity Lake";

export type DataSource = "Field sampling" | "DOE secondary";

export type QaStatus = "Verified" | "Suspect" | "Missing";

export type SamplePoint = {
  date: string;
  wqi: number;
  do: number;
  nh3: number;
  cod: number;
  bod: number | null;
  season: "Monsoon" | "Dry" | "Transition";
};

export type Station = {
  id: string;
  name: string;
  short: string;
  waterBody: WaterBody;
  role: string;
  x: number;
  y: number;
  klass: NwqsClass;
  previousClass: NwqsClass;
  trend: Trend;
  wqi: number;
  dragging: string;
  lastSample: string;
  source: DataSource;
  completeness: number;
  qaqc: "pass" | "fail" | "gap";
  fresh: boolean;
  sensitive: boolean;
  embargo: boolean;
  coords: string;
  method: string;
  replicates: number;
  collector: string;
  rainfallMm: number;
  instruments: string;
  labMethods: string;
  params: {
    ph: number;
    do: number;
    bod: number | null;
    cod: number;
    nh3n: number;
    tss: number;
    temp: number | null;
    turbidity: number | null;
    tp: number | null;
    nitrate: number | null;
    phosphate: number | null;
    chla: number | null;
    metals: string | null;
  };
  subindex: {
    ph: number;
    do: number;
    bod: number | null;
    cod: number;
    nh3n: number;
    tss: number;
  };
  series: SamplePoint[];
  shap: { name: string; weight: number }[];
  confidence: number;
  recallPolluted: number;
};

export type ArchiveRow = {
  id: string;
  date: string;
  stationId: string;
  wqi: number;
  klass: NwqsClass;
  ph: number;
  do: number;
  bod: number | null;
  cod: number;
  nh3n: number;
  tss: number;
  reading: "Lab" | "Probe";
  qa: QaStatus;
  visibility: "Public" | "Embargo" | "Restricted";
  completeness: number;
};

export type UploadRow = {
  id: string;
  stationId: string;
  date: string;
  ph: string;
  do: string;
  bod: string;
  cod: string;
  nh3n: string;
  tss: string;
  note: string;
  flag: QaStatus | "Merge";
  wqi: string;
  klass: string;
};
