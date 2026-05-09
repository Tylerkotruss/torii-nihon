"use client";

import { flagEmojiFromAlpha2, getAllCountries, type UiLocale } from "@/lib/countries";
import { getCadastroDict } from "@/lib/i18n/cadastro";
import { getSupabaseClient } from "@/lib/supabaseClient";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type CountryChoice = "BR" | "INTL";
type DocumentType = "CPF" | "Passport" | "Documento" | "Document";

type FormState = {
  country: CountryChoice | null;
  locale: UiLocale;
  documentType: DocumentType;
  countryAlpha2: string;

  email: string;
  password: string;
  confirmPassword: string;

  nomeCompleto: string;
  nomeSocial: string;
  informarNomeSocial: boolean;
  cpf: string;
  documentoInternacional: string;
  telefonePessoal: string;
  adicionarTelefoneContato: boolean;
  telefoneContato: string;
  nomeContato: string;
  cep: string;
  endereco: string;
  estadoCivil: string;

  senioridade: string;
  escolaridade: string;
  areaAtuacao: string;
  linkedin: string;
  instagram: string;

  cursos: string[];
  outrosDetalhe: string;

  aceitoTermos: boolean;
  aceitoPrivacidade: boolean;
};

const COURSE_OPTIONS = [
  "Data Analytics",
  "Pós-Graduação em Business Intelligence e Analytics",
  "Pós-Graduação em Gestão Estratégica de Dados",
  "Yto Academy",
  "Fiz pela empresa",
  "Vip Excel",
  "Vip Power BI",
  "Vip SQL Server",
  "Vip Python",
  "Outros",
] as const;

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function digitsOnly(value: string, maxLen?: number) {
  const d = value.replace(/\D/g, "");
  return maxLen != null ? d.slice(0, maxLen) : d;
}

function formatCpfInput(value: string) {
  const d = digitsOnly(value, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) {
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  }
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function formatCepInput(value: string) {
  const d = digitsOnly(value, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

function formatBrazilPhoneInput(value: string) {
  const d = digitsOnly(value, 11);
  if (!d) return "";
  if (d.length <= 2) return `(${d}`;
  const ddd = d.slice(0, 2);
  const rest = d.slice(2);
  if (!rest) return `(${ddd}) `;
  const isMobile = rest[0] === "9";
  if (isMobile) {
    const r = rest.slice(0, 9);
    if (r.length <= 5) return `(${ddd}) ${r}`;
    return `(${ddd}) ${r.slice(0, 5)}-${r.slice(5)}`;
  }
  const r = rest.slice(0, 8);
  if (r.length <= 4) return `(${ddd}) ${r}`;
  return `(${ddd}) ${r.slice(0, 4)}-${r.slice(4)}`;
}

function isValidCpfDigits(value: string): boolean {
  const cpf = digitsOnly(value, 11);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i += 1) {
    sum += parseInt(cpf[i]!, 10) * (10 - i);
  }
  let d1 = (sum * 10) % 11;
  if (d1 === 10) d1 = 0;
  if (d1 !== parseInt(cpf[9]!, 10)) return false;
  sum = 0;
  for (let i = 0; i < 10; i += 1) {
    sum += parseInt(cpf[i]!, 10) * (11 - i);
  }
  let d2 = (sum * 10) % 11;
  if (d2 === 10) d2 = 0;
  return d2 === parseInt(cpf[10]!, 10);
}

function isValidBrazilPhone(value: string): boolean {
  const n = digitsOnly(value);
  if (n.length !== 10 && n.length !== 11) return false;
  const ddd = parseInt(n.slice(0, 2), 10);
  if (Number.isNaN(ddd) || ddd < 11 || ddd > 99) return false;
  const rest = n.slice(2);
  if (rest.length === 9) return rest[0] === "9";
  if (rest.length === 8) return rest[0] !== "9";
  return false;
}

function isValidFullName(value: string): boolean {
  const t = value.trim();
  if (!t) return false;
  if (/\d/.test(t)) return false;
  const parts = t.split(/\s+/).filter(Boolean);
  return parts.length >= 2;
}

const MARITAL_VALUES = [
  "solteiro",
  "casado",
  "divorciado",
  "viuvo",
  "uniao_estavel",
] as const;

function isMaritalKey(value: string): value is (typeof MARITAL_VALUES)[number] {
  return (MARITAL_VALUES as readonly string[]).includes(value);
}

function normalizeInstagramInput(raw: string): string {
  const noSpace = raw.replace(/\s/g, "");
  if (!noSpace) return "";
  const body = noSpace.startsWith("@") ? noSpace.slice(1) : noSpace;
  const cleaned = body.replace(/^@+/, "");
  if (!cleaned) return "";
  return `@${cleaned}`;
}

function isValidLinkedInField(value: string): boolean {
  const t = value.trim();
  if (!t) return true;
  return t.toLowerCase().includes("linkedin.com");
}

const PROFILE_SENIORITY_KEYS = [
  "estagiario",
  "junior",
  "pleno",
  "senior",
  "especialista",
  "gestor",
] as const;

function isProfileSeniorityKey(
  v: string,
): v is (typeof PROFILE_SENIORITY_KEYS)[number] {
  return (PROFILE_SENIORITY_KEYS as readonly string[]).includes(v);
}

const PROFILE_EDUCATION_KEYS = [
  "medio_incompleto",
  "medio_completo",
  "superior_incompleto",
  "superior_completo",
  "pos",
  "mestrado",
  "doutorado",
] as const;

function isProfileEducationKey(
  v: string,
): v is (typeof PROFILE_EDUCATION_KEYS)[number] {
  return (PROFILE_EDUCATION_KEYS as readonly string[]).includes(v);
}

const PROFILE_AREA_KEYS_ORDER = [
  "tech_ti",
  "dados_analytics",
  "marketing",
  "vendas",
  "financeiro",
  "rh",
  "engenharia",
  "educacao",
  "saude",
  "juridico",
  "administracao",
  "logistica",
  "design",
  "produto",
  "outro",
] as const;

function isProfileAreaKey(
  v: string,
): v is (typeof PROFILE_AREA_KEYS_ORDER)[number] {
  return (PROFILE_AREA_KEYS_ORDER as readonly string[]).includes(v);
}

function formatPhoneHint(country: CountryChoice | null) {
  if (country === "BR") return "Ex: (11) 99999-9999";
  if (country === "INTL") return "Ex: +1 555 123 4567";
  return "Ex: +55 ...";
}

export default function CadastroPage() {
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isIntlPickerOpen, setIsIntlPickerOpen] = useState(false);
  const [countryQuery, setCountryQuery] = useState("");
  const [accessTouched, setAccessTouched] = useState({
    email: false,
    password: false,
    confirmPassword: false,
  });
  const [accessErrors, setAccessErrors] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [personalTouched, setPersonalTouched] = useState({
    nomeCompleto: false,
    documento: false,
    telefonePessoal: false,
    telefoneContato: false,
    nomeContato: false,
    estadoCivil: false,
    endereco: false,
    cep: false,
  });
  const [personalErrors, setPersonalErrors] = useState({
    nomeCompleto: "",
    documento: "",
    telefonePessoal: "",
    telefoneContato: "",
    nomeContato: "",
    estadoCivil: "",
    endereco: "",
    cep: "",
  });

  const [profileTouched, setProfileTouched] = useState({
    senioridade: false,
    escolaridade: false,
    areaAtuacao: false,
    linkedin: false,
  });
  const [profileErrors, setProfileErrors] = useState({
    senioridade: "",
    escolaridade: "",
    areaAtuacao: "",
    linkedin: "",
  });
  const [areaListOpen, setAreaListOpen] = useState(false);
  const [areaFilter, setAreaFilter] = useState("");
  const areaComboRef = useRef<HTMLDivElement | null>(null);
  const [legalTermsExpanded, setLegalTermsExpanded] = useState(false);
  const [legalPrivacyExpanded, setLegalPrivacyExpanded] = useState(false);

  const [form, setForm] = useState<FormState>(() => {
    let persistedLocale: UiLocale | null = null;
    try {
      if (typeof window !== "undefined") {
        const raw = localStorage.getItem("portal.locale");
        if (
          raw === "pt-BR" ||
          raw === "en" ||
          raw === "es" ||
          raw === "fr" ||
          raw === "ja" ||
          raw === "pt-PT"
        ) {
          persistedLocale = raw;
        }
      }
    } catch {
      // ignore
    }

    return {
      country: null,
      locale: persistedLocale ?? "pt-BR",
      documentType: "CPF",
      countryAlpha2: "",

      email: "",
      password: "",
      confirmPassword: "",

      nomeCompleto: "",
      nomeSocial: "",
      informarNomeSocial: false,
      cpf: "",
      documentoInternacional: "",
      telefonePessoal: "",
      adicionarTelefoneContato: false,
      telefoneContato: "",
      nomeContato: "",
      cep: "",
      endereco: "",
      estadoCivil: "",

      senioridade: "",
      escolaridade: "",
      areaAtuacao: "",
      linkedin: "",
      instagram: "",

      cursos: [],
      outrosDetalhe: "",

      aceitoTermos: false,
      aceitoPrivacidade: false,
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem("portal.locale", form.locale);
    } catch {
      // ignore
    }
  }, [form.locale]);

  const dict = useMemo(() => getCadastroDict(form.locale), [form.locale]);

  const filteredProfileAreaKeys = useMemo(() => {
    const q = areaFilter.trim().toLowerCase();
    return PROFILE_AREA_KEYS_ORDER.filter((key) => {
      const label = dict.profile.area[key].toLowerCase();
      return !q || label.includes(q);
    });
  }, [areaFilter, dict]);

  const areaFieldDisplay = useMemo(() => {
    if (areaListOpen) return areaFilter;
    if (form.areaAtuacao && isProfileAreaKey(form.areaAtuacao)) {
      return dict.profile.area[form.areaAtuacao];
    }
    return "";
  }, [areaListOpen, areaFilter, form.areaAtuacao, dict]);

  const allCountries = useMemo(() => getAllCountries(form.locale), [form.locale]);
  const intlCountries = useMemo(
    () => allCountries.filter((c) => c.alpha2 !== "BR"),
    [allCountries],
  );

  const TOP_COUNTRY_ALPHA2 = useMemo(
    () =>
      [
        "US",
        "ES",
        "PT",
        "FR",
        "JP",
        "DE",
        "GB",
        "IT",
        "CA",
        "MX",
        "AR",
        "CL",
        "IN",
        "CN",
        "AU",
      ] as const,
    [],
  );

  const topCountries = useMemo(() => {
    const set = new Set<string>(TOP_COUNTRY_ALPHA2);
    return intlCountries.filter((c) => set.has(c.alpha2));
  }, [TOP_COUNTRY_ALPHA2, intlCountries]);

  const selectedCountry = useMemo(() => {
    if (form.country === "BR") {
      return {
        alpha2: "BR",
        name: dict.countryBrazil,
        flag: flagEmojiFromAlpha2("BR"),
      };
    }
    if (form.country === "INTL" && form.countryAlpha2) {
      const match = allCountries.find((c) => c.alpha2 === form.countryAlpha2);
      return (
        match ?? {
          alpha2: form.countryAlpha2,
          name: form.countryAlpha2,
          flag: flagEmojiFromAlpha2(form.countryAlpha2),
        }
      );
    }
    return null;
  }, [allCountries, dict.countryBrazil, form.country, form.countryAlpha2]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleCourse(option: string) {
    setForm((prev) => {
      const exists = prev.cursos.includes(option);
      const cursos = exists
        ? prev.cursos.filter((c) => c !== option)
        : [...prev.cursos, option];
      return { ...prev, cursos };
    });
  }

  function mapCountryToLocale(alpha2: string): UiLocale {
    switch (alpha2.toUpperCase()) {
      case "BR":
        return "pt-BR";
      case "US":
        return "en";
      case "JP":
        return "ja";
      case "ES":
        return "es";
      case "FR":
        return "fr";
      case "PT":
        return "pt-PT";
      default:
        return "en";
    }
  }

  function mapCountryToDocumentType(alpha2: string): DocumentType {
    switch (alpha2.toUpperCase()) {
      case "BR":
        return "CPF";
      case "PT":
      case "ES":
        return "Documento";
      case "FR":
        return "Document";
      default:
        return "Passport";
    }
  }

  function selectBrazil() {
    update("country", "BR");
    update("countryAlpha2", "BR");
    update("locale", "pt-BR");
    update("documentType", "CPF");
  }

  function openInternationalPicker() {
    setCountryQuery("");
    setIsIntlPickerOpen(true);
  }

  function selectInternationalCountry(alpha2: string) {
    update("country", "INTL");
    update("countryAlpha2", alpha2);
    update("locale", mapCountryToLocale(alpha2));
    update("documentType", mapCountryToDocumentType(alpha2));
    setIsIntlPickerOpen(false);
  }

  // Base para evolução futura: pode usar navigator.language para sugerir país/idioma.
  function getBrowserLocaleHint(): string | null {
    if (typeof navigator === "undefined") return null;
    return navigator.language || null;
  }

  const EMAIL_REGEX =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const PASSWORD_ALLOWED_REGEX =
    /^[A-Za-z0-9!@#$%&*()_\-+=]{6,12}$/;

  function isAsciiOnly(value: string) {
    for (let i = 0; i < value.length; i += 1) {
      if (value.charCodeAt(i) > 127) return false;
    }
    return true;
  }

  function validateEmail(value: string) {
    const v = value.trim();
    if (!v) return false;
    return EMAIL_REGEX.test(v);
  }

  function validatePassword(value: string) {
    if (!value) return false;
    if (value.length < 6 || value.length > 12) return false;
    if (!isAsciiOnly(value)) return false;
    return PASSWORD_ALLOWED_REGEX.test(value);
  }

  const validateAccessStep = useCallback(() => {
    const emailOk = validateEmail(form.email);
    const passwordOk = validatePassword(form.password);

    const nextErrors = {
      email: "",
      password: "",
      confirmPassword: "",
    };

    if (!form.email.trim() && !form.password && !form.confirmPassword) {
      nextErrors.email = dict.messages.invalidEmail;
      nextErrors.password = dict.messages.invalidPassword;
      nextErrors.confirmPassword = dict.messages.passwordMismatch;
      return { ok: false, errors: nextErrors };
    }

    if (!form.email.trim()) nextErrors.email = dict.messages.invalidEmail;
    else if (!emailOk) nextErrors.email = dict.messages.invalidEmail;

    if (!form.password) nextErrors.password = dict.messages.invalidPassword;
    else if (!passwordOk) nextErrors.password = dict.messages.invalidPassword;

    if (!form.confirmPassword) {
      nextErrors.confirmPassword = dict.messages.passwordMismatch;
    } else if (!passwordOk || form.confirmPassword !== form.password) {
      nextErrors.confirmPassword = dict.messages.passwordMismatch;
    }

    const ok =
      emailOk &&
      passwordOk &&
      form.confirmPassword.length > 0 &&
      form.confirmPassword === form.password;

    return { ok, errors: nextErrors };
  }, [
    dict.messages.invalidEmail,
    dict.messages.invalidPassword,
    dict.messages.passwordMismatch,
    form.confirmPassword,
    form.email,
    form.password,
  ]);

  const validatePersonalStep = useCallback(() => {
    const errors = {
      nomeCompleto: "",
      documento: "",
      telefonePessoal: "",
      telefoneContato: "",
      nomeContato: "",
      estadoCivil: "",
      endereco: "",
      cep: "",
    };
    let ok = true;

    if (!isValidFullName(form.nomeCompleto)) {
      errors.nomeCompleto = dict.messages.fullNameInvalid;
      ok = false;
    }

    if (form.country === "BR") {
      if (!isValidCpfDigits(form.cpf)) {
        errors.documento = dict.messages.invalidCpf;
        ok = false;
      }
    } else if (
      !form.documentoInternacional.trim() ||
      form.documentoInternacional.trim().length < 3
    ) {
      errors.documento = dict.messages.enterDocument;
      ok = false;
    }

    if (form.country === "BR") {
      if (!form.telefonePessoal.trim()) {
        errors.telefonePessoal = dict.messages.enterPhone;
        ok = false;
      } else if (!isValidBrazilPhone(form.telefonePessoal)) {
        errors.telefonePessoal = dict.messages.invalidPersonalPhone;
        ok = false;
      }
    } else {
      const pd = digitsOnly(form.telefonePessoal);
      if (!form.telefonePessoal.trim()) {
        errors.telefonePessoal = dict.messages.enterPhone;
        ok = false;
      } else if (pd.length < 8) {
        errors.telefonePessoal = dict.messages.invalidPersonalPhone;
        ok = false;
      }
    }

    if (form.adicionarTelefoneContato) {
      if (form.country === "BR") {
        if (!form.telefoneContato.trim()) {
          errors.telefoneContato = dict.messages.contactPhoneRequired;
          ok = false;
        } else if (!isValidBrazilPhone(form.telefoneContato)) {
          errors.telefoneContato = dict.messages.invalidPersonalPhone;
          ok = false;
        }
      } else {
        const tcd = digitsOnly(form.telefoneContato);
        if (!form.telefoneContato.trim()) {
          errors.telefoneContato = dict.messages.contactPhoneRequired;
          ok = false;
        } else if (tcd.length < 8) {
          errors.telefoneContato = dict.messages.invalidPersonalPhone;
          ok = false;
        }
      }
      if (!form.nomeContato.trim()) {
        errors.nomeContato = dict.messages.contactNameRequired;
        ok = false;
      }
    }

    if (!form.estadoCivil || !isMaritalKey(form.estadoCivil)) {
      errors.estadoCivil = dict.messages.maritalRequired;
      ok = false;
    }

    if (!form.endereco.trim()) {
      errors.endereco = dict.messages.addressRequired;
      ok = false;
    }

    if (form.country === "BR") {
      if (digitsOnly(form.cep).length !== 8) {
        errors.cep = dict.messages.invalidCep;
        ok = false;
      }
    } else if (form.cep.trim().length < 3) {
      errors.cep = dict.messages.invalidPostalCode;
      ok = false;
    }

    return { ok, errors };
  }, [dict, form]);

  const validateProfileStep = useCallback(() => {
    const errors = {
      senioridade: "",
      escolaridade: "",
      areaAtuacao: "",
      linkedin: "",
    };
    let ok = true;

    if (!form.senioridade || !isProfileSeniorityKey(form.senioridade)) {
      errors.senioridade = dict.messages.seniorityRequired;
      ok = false;
    }
    if (!form.escolaridade || !isProfileEducationKey(form.escolaridade)) {
      errors.escolaridade = dict.messages.educationRequired;
      ok = false;
    }
    if (!form.areaAtuacao || !isProfileAreaKey(form.areaAtuacao)) {
      errors.areaAtuacao = dict.messages.areaRequired;
      ok = false;
    }
    if (form.linkedin.trim() && !isValidLinkedInField(form.linkedin)) {
      errors.linkedin = dict.messages.invalidLinkedin;
      ok = false;
    }

    return { ok, errors };
  }, [dict, form]);

  function canGoNext(): { ok: boolean; message?: string } {
    if (step === 0) {
      if (!form.country) return { ok: false, message: dict.messages.chooseCountry };
      return { ok: true };
    }
    if (step === 1) {
      const res = validateAccessStep();
      if (!res.ok) {
        return { ok: false, message: dict.messages.fillAccessFields };
      }
      return { ok: true };
    }
    if (step === 2) {
      const res = validatePersonalStep();
      if (!res.ok) {
        return { ok: false, message: dict.messages.fillPersonalFields };
      }
      return { ok: true };
    }
    if (step === 3) {
      const res = validateProfileStep();
      if (!res.ok) {
        return { ok: false, message: dict.messages.fillProfileFields };
      }
      return { ok: true };
    }
    if (step === 4) {
      if (form.cursos.includes("Outros") && !form.outrosDetalhe.trim()) {
        return { ok: false, message: dict.messages.detailOther };
      }
      return { ok: true };
    }
    if (step === 5) {
      if (!form.aceitoTermos || !form.aceitoPrivacidade) {
        return { ok: false, message: dict.messages.acceptLegal };
      }
      return { ok: true };
    }
    return { ok: true };
  }

  useEffect(() => {
    if (step !== 1) return;
    if (
      !accessTouched.email &&
      !accessTouched.password &&
      !accessTouched.confirmPassword
    ) {
      return;
    }

    const res = validateAccessStep();
    setAccessErrors((prev) => ({
      email: accessTouched.email ? res.errors.email : prev.email,
      password: accessTouched.password ? res.errors.password : prev.password,
      confirmPassword: accessTouched.confirmPassword
        ? res.errors.confirmPassword
        : prev.confirmPassword,
    }));

    if (res.ok) {
      setErrorMessage(null);
    }
  }, [
    step,
    validateAccessStep,
    accessTouched.email,
    accessTouched.password,
    accessTouched.confirmPassword,
  ]);

  useEffect(() => {
    if (step !== 2) return;
    if (
      !personalTouched.nomeCompleto &&
      !personalTouched.documento &&
      !personalTouched.telefonePessoal &&
      !personalTouched.telefoneContato &&
      !personalTouched.nomeContato &&
      !personalTouched.estadoCivil &&
      !personalTouched.endereco &&
      !personalTouched.cep
    ) {
      return;
    }

    const res = validatePersonalStep();
    setPersonalErrors((prev) => ({
      nomeCompleto: personalTouched.nomeCompleto
        ? res.errors.nomeCompleto
        : prev.nomeCompleto,
      documento: personalTouched.documento
        ? res.errors.documento
        : prev.documento,
      telefonePessoal: personalTouched.telefonePessoal
        ? res.errors.telefonePessoal
        : prev.telefonePessoal,
      telefoneContato: personalTouched.telefoneContato
        ? res.errors.telefoneContato
        : prev.telefoneContato,
      nomeContato: personalTouched.nomeContato
        ? res.errors.nomeContato
        : prev.nomeContato,
      estadoCivil: personalTouched.estadoCivil
        ? res.errors.estadoCivil
        : prev.estadoCivil,
      endereco: personalTouched.endereco ? res.errors.endereco : prev.endereco,
      cep: personalTouched.cep ? res.errors.cep : prev.cep,
    }));

    if (res.ok) {
      setErrorMessage(null);
    }
  }, [
    step,
    validatePersonalStep,
    personalTouched.nomeCompleto,
    personalTouched.documento,
    personalTouched.telefonePessoal,
    personalTouched.telefoneContato,
    personalTouched.nomeContato,
    personalTouched.estadoCivil,
    personalTouched.endereco,
    personalTouched.cep,
  ]);

  useEffect(() => {
    if (step !== 3) return;
    if (
      !profileTouched.senioridade &&
      !profileTouched.escolaridade &&
      !profileTouched.areaAtuacao &&
      !profileTouched.linkedin
    ) {
      return;
    }

    const res = validateProfileStep();
    setProfileErrors((prev) => ({
      senioridade: profileTouched.senioridade
        ? res.errors.senioridade
        : prev.senioridade,
      escolaridade: profileTouched.escolaridade
        ? res.errors.escolaridade
        : prev.escolaridade,
      areaAtuacao: profileTouched.areaAtuacao
        ? res.errors.areaAtuacao
        : prev.areaAtuacao,
      linkedin: profileTouched.linkedin ? res.errors.linkedin : prev.linkedin,
    }));

    if (res.ok) {
      setErrorMessage(null);
    }
  }, [
    step,
    validateProfileStep,
    profileTouched.senioridade,
    profileTouched.escolaridade,
    profileTouched.areaAtuacao,
    profileTouched.linkedin,
  ]);

  useEffect(() => {
    if (step !== 3) {
      setAreaListOpen(false);
      setAreaFilter("");
    }
  }, [step]);

  useEffect(() => {
    if (!areaListOpen) return;
    function onDocMouseDown(e: MouseEvent) {
      const el = areaComboRef.current;
      if (el && !el.contains(e.target as Node)) {
        setAreaListOpen(false);
        setAreaFilter("");
      }
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [areaListOpen]);

  useEffect(() => {
    if (step !== 5) {
      setLegalTermsExpanded(false);
      setLegalPrivacyExpanded(false);
    }
  }, [step]);

  function next() {
    setErrorMessage(null);
    if (step === 1) {
      setAccessTouched({
        email: true,
        password: true,
        confirmPassword: true,
      });
      const res = validateAccessStep();
      setAccessErrors(res.errors);
      if (!res.ok) {
        setErrorMessage(dict.messages.fillAccessFields);
        return;
      }
      setAccessErrors({ email: "", password: "", confirmPassword: "" });
      setStep((s) => Math.min(5, s + 1));
      return;
    }

    if (step === 2) {
      setPersonalTouched({
        nomeCompleto: true,
        documento: true,
        telefonePessoal: true,
        telefoneContato: true,
        nomeContato: true,
        estadoCivil: true,
        endereco: true,
        cep: true,
      });
      const res = validatePersonalStep();
      setPersonalErrors(res.errors);
      if (!res.ok) {
        setErrorMessage(dict.messages.fillPersonalFields);
        return;
      }
      setPersonalErrors({
        nomeCompleto: "",
        documento: "",
        telefonePessoal: "",
        telefoneContato: "",
        nomeContato: "",
        estadoCivil: "",
        endereco: "",
        cep: "",
      });
      setStep((s) => Math.min(5, s + 1));
      return;
    }

    if (step === 3) {
      setProfileTouched({
        senioridade: true,
        escolaridade: true,
        areaAtuacao: true,
        linkedin: true,
      });
      const res = validateProfileStep();
      setProfileErrors(res.errors);
      if (!res.ok) {
        setErrorMessage(dict.messages.fillProfileFields);
        return;
      }
      setProfileErrors({
        senioridade: "",
        escolaridade: "",
        areaAtuacao: "",
        linkedin: "",
      });
      setAreaListOpen(false);
      setAreaFilter("");
      setStep((s) => Math.min(5, s + 1));
      return;
    }

    const gate = canGoNext();
    if (!gate.ok) {
      setErrorMessage(gate.message ?? dict.messages.verifyFields);
      return;
    }
    setStep((s) => Math.min(5, s + 1));
  }

  function back() {
    setErrorMessage(null);
    setStep((s) => Math.max(0, s - 1));
  }

  async function finish() {
    setErrorMessage(null);
    setSuccessMessage(null);

    const gate = canGoNext();
    if (!gate.ok) {
      setErrorMessage(gate.message ?? dict.messages.verifyFields);
      return;
    }

    setIsLoading(true);
    try {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      });

      if (error) {
        setErrorMessage(
          `${dict.messages.signUpAuthFailed} ${error.message}`,
        );
        return;
      }

      const userId = data.user?.id;

      if (!userId) {
        setSuccessMessage(dict.messages.checkEmailConfirm);
        return;
      }

      const alunoPayload = {
        id: userId,
        email: form.email,
        nome_completo: form.nomeCompleto,
        telefone_pessoal: form.telefonePessoal,
        nivel_senioridade: form.senioridade || null,
        nivel_escolaridade: form.escolaridade || null,
        idioma: form.locale,
        tipo_documento: form.documentType,
        nome_social: form.informarNomeSocial ? form.nomeSocial.trim() || null : null,
        cpf: form.country === "BR" ? form.cpf : null,
        documento_internacional:
          form.country === "INTL" ? form.documentoInternacional || null : null,
        telefone_contato: form.adicionarTelefoneContato
          ? form.telefoneContato || null
          : null,
        nome_contato: form.adicionarTelefoneContato
          ? form.nomeContato.trim() || null
          : null,
        cep: form.cep.trim() || null,
        endereco: form.endereco || null,
        estado_civil: form.estadoCivil || null,
        area_atuacao: form.areaAtuacao || null,
        linkedin: form.linkedin.trim() || null,
        instagram: form.instagram.trim() || null,
        cursos_yto: form.cursos,
        cursos_outros_detalhe: form.cursos.includes("Outros")
          ? form.outrosDetalhe.trim()
          : null,
        pais: selectedCountry?.name ?? null,
        pais_codigo: form.countryAlpha2 || null,
      };

      const { error: insertError } = await supabase
        .from("alunos")
        .insert(alunoPayload);

      if (insertError) {
        setErrorMessage(insertError.message);
        return;
      }

      try {
        localStorage.removeItem("portal.cadastro.draft.v1");
      } catch {
        // ignore
      }

      await supabase.auth.signOut();
      router.push("/login");
    } catch (err) {
      console.error("[cadastro] finish:", err);
      setErrorMessage(
        err instanceof Error ? err.message : dict.messages.verifyFields,
      );
    } finally {
      setIsLoading(false);
    }
  }

  const inputBase =
    "h-10 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20";
  const inputError =
    "border-red-500/70 focus:border-red-500 focus:ring-red-500/20";
  const labelBase = "text-sm font-medium text-zinc-300";
  const stepHeader =
    step === 1
      ? dict.stepHeaders.access
      : step === 2
        ? dict.stepHeaders.personal
        : step === 3
          ? dict.stepHeaders.profile
          : step === 4
            ? dict.stepHeaders.history
            : step === 5
              ? dict.stepHeaders.legal
              : dict.selectCountryTitle;

  return (
    <div
      className={cx(
        "min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center px-4",
        "py-8 sm:py-16 lg:py-24",
      )}
      style={
        {
          background:
            "radial-gradient(1200px 520px at 50% 40%, rgba(124,58,237,0.12), rgba(0,0,0,0) 55%), radial-gradient(900px 420px at 50% 55%, rgba(255,255,255,0.06), rgba(0,0,0,0) 60%), #09090b",
        }
      }
    >
      <div className="w-full max-w-3xl">
        <div
          className="rounded-2xl border border-zinc-800/90 bg-zinc-950 px-5 py-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_24px_80px_rgba(0,0,0,0.65)] sm:rounded-[28px] sm:px-10 sm:py-12"
          style={{
            boxShadow:
              "0 0 0 1px rgba(255,255,255,0.04), 0 24px 80px rgba(0,0,0,0.65), 0 0 120px rgba(124,58,237,0.10)",
          }}
        >
          <div className="text-center">
            <div className="text-2xl font-semibold tracking-[0.12em] text-zinc-100 sm:text-3xl sm:tracking-[0.16em] lg:text-4xl lg:tracking-[0.18em]">
              {step === 0 ? dict.selectCountryTitle : stepHeader}
            </div>
            <div className="mt-3 text-sm text-zinc-400 sm:text-base">
              {step === 0 ? dict.selectCountrySubtitle : dict.stepSubtitle}
            </div>
            <p className="mt-4 text-sm text-zinc-400">
              Já tem conta?{" "}
              <Link
                href="/login"
                className="font-semibold text-violet-200 underline-offset-4 transition-colors hover:text-violet-100 hover:underline"
              >
                Entrar
              </Link>
            </p>
          </div>

          {errorMessage ? (
            <div className="mt-5 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {errorMessage}
            </div>
          ) : null}

          {successMessage ? (
            <div className="mt-5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
              {successMessage}
            </div>
          ) : null}

          <div className="mt-6">
            {step === 0 ? (
              <div className="mt-10">
                <div className="grid gap-8 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={selectBrazil}
                    className={cx(
                      "w-full rounded-2xl border bg-zinc-950/40 px-8 py-7 text-left transition-colors cursor-pointer",
                      form.country === "BR"
                        ? "border-violet-500 bg-violet-500/10 shadow-[0_0_0_1px_rgba(124,58,237,0.25),0_0_48px_rgba(124,58,237,0.18)]"
                        : "border-zinc-800/70 hover:bg-zinc-900/30",
                    )}
                  >
                    <div className="flex items-center gap-6">
                      <div
                        className={cx(
                          "h-14 w-14 rounded-full border flex items-center justify-center text-2xl",
                          form.country === "BR"
                            ? "border-violet-500/60 bg-violet-500/15"
                            : "border-zinc-800 bg-zinc-950",
                        )}
                        aria-hidden="true"
                      >
                        <span className={cx(form.country === "BR" && "text-violet-200")}>
                          {flagEmojiFromAlpha2("BR")}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="text-xl font-semibold text-zinc-100">
                          {dict.countryBrazil}
                        </div>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={openInternationalPicker}
                    className={cx(
                      "w-full rounded-2xl border bg-zinc-950/40 px-8 py-7 text-left transition-colors cursor-pointer",
                      form.country === "INTL"
                        ? "border-violet-500 bg-violet-500/10 shadow-[0_0_0_1px_rgba(124,58,237,0.25),0_0_48px_rgba(124,58,237,0.18)]"
                        : "border-zinc-800/70 hover:bg-zinc-900/30",
                    )}
                  >
                    <div className="flex items-center gap-6">
                      <div
                        className={cx(
                          "h-14 w-14 rounded-full border flex items-center justify-center text-2xl",
                          form.country === "INTL"
                            ? "border-violet-500/60 bg-violet-500/15"
                            : "border-zinc-800 bg-zinc-950",
                        )}
                        aria-hidden="true"
                      >
                        <span
                          className={cx(
                            form.country === "INTL"
                              ? "text-violet-300"
                              : "text-violet-300/80",
                          )}
                        >
                          {selectedCountry?.flag ?? "🌍"}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="text-xl font-semibold text-zinc-100">
                          {selectedCountry?.name ?? dict.countryInternational}
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            ) : null}

            {step === 0 && isIntlPickerOpen ? (
              <div className="fixed inset-0 z-50">
                <button
                  type="button"
                  className="absolute inset-0 bg-black/60"
                  aria-label={dict.close}
                  onClick={() => setIsIntlPickerOpen(false)}
                />
                <div className="relative mx-auto mt-24 w-[min(560px,calc(100%-2rem))] rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.75),0_0_80px_rgba(124,58,237,0.18)]">
                  <div className="flex items-center justify-between gap-6">
                    <div className="text-sm font-semibold text-zinc-100">
                      {dict.selectCountryModalTitle}
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsIntlPickerOpen(false)}
                      className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-900"
                    >
                      {dict.close}
                    </button>
                  </div>

                  <div className="mt-4">
                    <input
                      value={countryQuery}
                      onChange={(e) => setCountryQuery(e.target.value)}
                      placeholder={dict.searchPlaceholder}
                      className="h-10 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20"
                    />
                    <div className="mt-3 max-h-[52vh] overflow-auto pr-1">
                      {countryQuery.trim() ? (
                        <div className="grid gap-2 sm:grid-cols-2">
                          {intlCountries
                            .filter((c) =>
                              c.name
                                .toLowerCase()
                                .includes(countryQuery.trim().toLowerCase()),
                            )
                            .map((c) => (
                              <button
                                key={c.alpha2}
                                type="button"
                                onClick={() =>
                                  selectInternationalCountry(c.alpha2)
                                }
                                className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-left hover:bg-zinc-900/60 transition-colors"
                              >
                                <span className="text-2xl" aria-hidden="true">
                                  {c.flag}
                                </span>
                                <span className="text-sm font-medium text-zinc-100">
                                  {c.name}
                                </span>
                              </button>
                            ))}
                        </div>
                      ) : (
                        <div>
                          <div className="mb-2 text-xs font-medium text-zinc-400">
                            Principais países
                          </div>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {topCountries.map((c) => (
                              <button
                                key={c.alpha2}
                                type="button"
                                onClick={() =>
                                  selectInternationalCountry(c.alpha2)
                                }
                                className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-left hover:bg-zinc-900/60 transition-colors"
                              >
                                <span className="text-2xl" aria-hidden="true">
                                  {c.flag}
                                </span>
                                <span className="text-sm font-medium text-zinc-100">
                                  {c.name}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {step === 1 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-1 sm:col-span-2">
                  <span className={labelBase}>{dict.labels.email}</span>
                  <input
                    className={cx(
                      inputBase,
                      accessTouched.email && accessErrors.email && inputError,
                    )}
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => {
                      setAccessTouched((t) => ({ ...t, email: true }));
                      update("email", e.target.value);
                    }}
                    onBlur={() =>
                      setAccessTouched((t) => ({ ...t, email: true }))
                    }
                    required
                  />
                  {accessTouched.email && accessErrors.email ? (
                    <span className="block text-xs text-red-300/90">
                      {accessErrors.email}
                    </span>
                  ) : null}
                </label>
                <label className="block space-y-1">
                  <span className={labelBase}>{dict.labels.password}</span>
                  <input
                    className={cx(
                      inputBase,
                      accessTouched.password &&
                        accessErrors.password &&
                        inputError,
                    )}
                    type="password"
                    autoComplete="new-password"
                    value={form.password}
                    onChange={(e) => {
                      setAccessTouched((t) => ({ ...t, password: true }));
                      update("password", e.target.value);
                    }}
                    onBlur={() =>
                      setAccessTouched((t) => ({ ...t, password: true }))
                    }
                    required
                  />
                  {accessTouched.password && accessErrors.password ? (
                    <span className="block text-xs text-red-300/90">
                      {accessErrors.password}
                    </span>
                  ) : null}
                </label>
                <label className="block space-y-1">
                  <span className={labelBase}>{dict.labels.confirmPassword}</span>
                  <input
                    className={cx(
                      inputBase,
                      accessTouched.confirmPassword &&
                        accessErrors.confirmPassword &&
                        inputError,
                    )}
                    type="password"
                    autoComplete="new-password"
                    value={form.confirmPassword}
                    onChange={(e) => {
                      setAccessTouched((t) => ({
                        ...t,
                        confirmPassword: true,
                      }));
                      update("confirmPassword", e.target.value);
                    }}
                    onBlur={() =>
                      setAccessTouched((t) => ({
                        ...t,
                        confirmPassword: true,
                      }))
                    }
                    required
                  />
                  {accessTouched.confirmPassword &&
                  accessErrors.confirmPassword ? (
                    <span className="block text-xs text-red-300/90">
                      {accessErrors.confirmPassword}
                    </span>
                  ) : null}
                </label>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-1 sm:col-span-2">
                  <span className={labelBase}>{dict.labels.fullName}</span>
                  <input
                    className={cx(
                      inputBase,
                      personalTouched.nomeCompleto &&
                        personalErrors.nomeCompleto &&
                        inputError,
                    )}
                    value={form.nomeCompleto}
                    onChange={(e) => {
                      setPersonalTouched((t) => ({ ...t, nomeCompleto: true }));
                      update("nomeCompleto", e.target.value);
                    }}
                    onBlur={() =>
                      setPersonalTouched((t) => ({ ...t, nomeCompleto: true }))
                    }
                    autoComplete="name"
                  />
                  {personalTouched.nomeCompleto && personalErrors.nomeCompleto ? (
                    <span className="block text-xs text-red-300/90">
                      {personalErrors.nomeCompleto}
                    </span>
                  ) : null}
                </label>

                <label className="flex cursor-pointer items-start gap-3 sm:col-span-2">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 shrink-0 rounded border border-zinc-700 bg-zinc-950 accent-violet-500 focus:ring-2 focus:ring-violet-500/25"
                    checked={form.informarNomeSocial}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setForm((prev) => ({
                        ...prev,
                        informarNomeSocial: checked,
                        nomeSocial: checked ? prev.nomeSocial : "",
                      }));
                    }}
                  />
                  <span className="text-sm leading-snug text-zinc-300">
                    {dict.labels.useSocialName}
                  </span>
                </label>

                {form.informarNomeSocial ? (
                  <label className="block space-y-1 sm:col-span-2">
                    <span className={labelBase}>{dict.labels.socialName}</span>
                    <input
                      className={inputBase}
                      value={form.nomeSocial}
                      onChange={(e) => update("nomeSocial", e.target.value)}
                      autoComplete="nickname"
                    />
                  </label>
                ) : null}

                {form.country === "BR" ? (
                  <label className="block space-y-1 sm:col-span-2">
                    <span className={labelBase}>{dict.labels.documentCpf}</span>
                    <input
                      className={cx(
                        inputBase,
                        personalTouched.documento &&
                          personalErrors.documento &&
                          inputError,
                      )}
                      inputMode="numeric"
                      autoComplete="off"
                      value={form.cpf}
                      onChange={(e) => {
                        setPersonalTouched((t) => ({ ...t, documento: true }));
                        update("cpf", formatCpfInput(e.target.value));
                      }}
                      onBlur={() =>
                        setPersonalTouched((t) => ({ ...t, documento: true }))
                      }
                    />
                    {personalTouched.documento && personalErrors.documento ? (
                      <span className="block text-xs text-red-300/90">
                        {personalErrors.documento}
                      </span>
                    ) : null}
                  </label>
                ) : (
                  <label className="block space-y-1 sm:col-span-2">
                    <span className={labelBase}>{dict.labels.documentIntl}</span>
                    <input
                      className={cx(
                        inputBase,
                        personalTouched.documento &&
                          personalErrors.documento &&
                          inputError,
                      )}
                      value={form.documentoInternacional}
                      onChange={(e) => {
                        setPersonalTouched((t) => ({ ...t, documento: true }));
                        update("documentoInternacional", e.target.value);
                      }}
                      onBlur={() =>
                        setPersonalTouched((t) => ({ ...t, documento: true }))
                      }
                    />
                    {personalTouched.documento && personalErrors.documento ? (
                      <span className="block text-xs text-red-300/90">
                        {personalErrors.documento}
                      </span>
                    ) : null}
                  </label>
                )}

                <label className="block space-y-1 sm:col-span-2">
                  <span className={labelBase}>{dict.labels.personalPhone}</span>
                  <input
                    className={cx(
                      inputBase,
                      personalTouched.telefonePessoal &&
                        personalErrors.telefonePessoal &&
                        inputError,
                    )}
                    inputMode="tel"
                    autoComplete="tel"
                    value={form.telefonePessoal}
                    onChange={(e) => {
                      setPersonalTouched((t) => ({
                        ...t,
                        telefonePessoal: true,
                      }));
                      update(
                        "telefonePessoal",
                        form.country === "BR"
                          ? formatBrazilPhoneInput(e.target.value)
                          : e.target.value,
                      );
                    }}
                    onBlur={() =>
                      setPersonalTouched((t) => ({
                        ...t,
                        telefonePessoal: true,
                      }))
                    }
                    placeholder={formatPhoneHint(form.country)}
                  />
                  {personalTouched.telefonePessoal &&
                  personalErrors.telefonePessoal ? (
                    <span className="block text-xs text-red-300/90">
                      {personalErrors.telefonePessoal}
                    </span>
                  ) : null}
                </label>

                <label className="flex cursor-pointer items-start gap-3 sm:col-span-2">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 shrink-0 rounded border border-zinc-700 bg-zinc-950 accent-violet-500 focus:ring-2 focus:ring-violet-500/25"
                    checked={form.adicionarTelefoneContato}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setForm((prev) => ({
                        ...prev,
                        adicionarTelefoneContato: checked,
                        telefoneContato: checked ? prev.telefoneContato : "",
                        nomeContato: checked ? prev.nomeContato : "",
                      }));
                    }}
                  />
                  <span className="text-sm leading-snug text-zinc-300">
                    {dict.labels.addContactPhone}
                  </span>
                </label>

                {form.adicionarTelefoneContato ? (
                  <>
                    <label className="block space-y-1">
                      <span className={labelBase}>
                        {dict.labels.contactPhone}
                      </span>
                      <input
                        className={cx(
                          inputBase,
                          personalTouched.telefoneContato &&
                            personalErrors.telefoneContato &&
                            inputError,
                        )}
                        inputMode="tel"
                        autoComplete="tel"
                        value={form.telefoneContato}
                        onChange={(e) => {
                          setPersonalTouched((t) => ({
                            ...t,
                            telefoneContato: true,
                          }));
                          update(
                            "telefoneContato",
                            form.country === "BR"
                              ? formatBrazilPhoneInput(e.target.value)
                              : e.target.value,
                          );
                        }}
                        onBlur={() =>
                          setPersonalTouched((t) => ({
                            ...t,
                            telefoneContato: true,
                          }))
                        }
                        placeholder={formatPhoneHint(form.country)}
                      />
                      {personalTouched.telefoneContato &&
                      personalErrors.telefoneContato ? (
                        <span className="block text-xs text-red-300/90">
                          {personalErrors.telefoneContato}
                        </span>
                      ) : null}
                    </label>
                    <label className="block space-y-1">
                      <span className={labelBase}>{dict.labels.contactName}</span>
                      <input
                        className={cx(
                          inputBase,
                          personalTouched.nomeContato &&
                            personalErrors.nomeContato &&
                            inputError,
                        )}
                        value={form.nomeContato}
                        onChange={(e) => {
                          setPersonalTouched((t) => ({
                            ...t,
                            nomeContato: true,
                          }));
                          update("nomeContato", e.target.value);
                        }}
                        onBlur={() =>
                          setPersonalTouched((t) => ({
                            ...t,
                            nomeContato: true,
                          }))
                        }
                        autoComplete="name"
                      />
                      {personalTouched.nomeContato &&
                      personalErrors.nomeContato ? (
                        <span className="block text-xs text-red-300/90">
                          {personalErrors.nomeContato}
                        </span>
                      ) : null}
                    </label>
                  </>
                ) : null}

                <label className="block space-y-1 sm:col-span-2">
                  <span className={labelBase}>{dict.labels.maritalStatus}</span>
                  <select
                    className={cx(
                      inputBase,
                      personalTouched.estadoCivil &&
                        personalErrors.estadoCivil &&
                        inputError,
                    )}
                    value={form.estadoCivil}
                    onChange={(e) => {
                      setPersonalTouched((t) => ({
                        ...t,
                        estadoCivil: true,
                      }));
                      update("estadoCivil", e.target.value);
                    }}
                    onBlur={() =>
                      setPersonalTouched((t) => ({ ...t, estadoCivil: true }))
                    }
                  >
                    <option value="">{dict.marital.placeholder}</option>
                    <option value="solteiro">{dict.marital.solteiro}</option>
                    <option value="casado">{dict.marital.casado}</option>
                    <option value="divorciado">{dict.marital.divorciado}</option>
                    <option value="viuvo">{dict.marital.viuvo}</option>
                    <option value="uniao_estavel">
                      {dict.marital.uniao_estavel}
                    </option>
                  </select>
                  {personalTouched.estadoCivil && personalErrors.estadoCivil ? (
                    <span className="block text-xs text-red-300/90">
                      {personalErrors.estadoCivil}
                    </span>
                  ) : null}
                </label>

                <label className="block space-y-1 sm:col-span-2">
                  <span className={labelBase}>{dict.labels.cep}</span>
                  <input
                    className={cx(
                      inputBase,
                      personalTouched.cep && personalErrors.cep && inputError,
                    )}
                    inputMode={form.country === "BR" ? "numeric" : "text"}
                    autoComplete="postal-code"
                    value={form.cep}
                    onChange={(e) => {
                      setPersonalTouched((t) => ({ ...t, cep: true }));
                      update(
                        "cep",
                        form.country === "BR"
                          ? formatCepInput(e.target.value)
                          : e.target.value,
                      );
                    }}
                    onBlur={() =>
                      setPersonalTouched((t) => ({ ...t, cep: true }))
                    }
                    placeholder={
                      form.country === "BR" ? "00000-000" : undefined
                    }
                  />
                  {personalTouched.cep && personalErrors.cep ? (
                    <span className="block text-xs text-red-300/90">
                      {personalErrors.cep}
                    </span>
                  ) : null}
                </label>

                <label className="block space-y-1 sm:col-span-2">
                  <span className={labelBase}>{dict.labels.address}</span>
                  <input
                    className={cx(
                      inputBase,
                      personalTouched.endereco &&
                        personalErrors.endereco &&
                        inputError,
                    )}
                    value={form.endereco}
                    onChange={(e) => {
                      setPersonalTouched((t) => ({ ...t, endereco: true }));
                      update("endereco", e.target.value);
                    }}
                    onBlur={() =>
                      setPersonalTouched((t) => ({ ...t, endereco: true }))
                    }
                    autoComplete="street-address"
                  />
                  {personalTouched.endereco && personalErrors.endereco ? (
                    <span className="block text-xs text-red-300/90">
                      {personalErrors.endereco}
                    </span>
                  ) : null}
                </label>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-1">
                  <span className={labelBase}>{dict.labels.seniority}</span>
                  <select
                    className={cx(
                      inputBase,
                      profileTouched.senioridade &&
                        profileErrors.senioridade &&
                        inputError,
                    )}
                    value={form.senioridade}
                    onChange={(e) => {
                      setProfileTouched((t) => ({ ...t, senioridade: true }));
                      update("senioridade", e.target.value);
                    }}
                    onBlur={() =>
                      setProfileTouched((t) => ({ ...t, senioridade: true }))
                    }
                  >
                    <option value="">
                      {dict.profile.seniorityPlaceholder}
                    </option>
                    {PROFILE_SENIORITY_KEYS.map((k) => (
                      <option key={k} value={k}>
                        {dict.profile.seniority[k]}
                      </option>
                    ))}
                  </select>
                  {profileTouched.senioridade && profileErrors.senioridade ? (
                    <span className="block text-xs text-red-300/90">
                      {profileErrors.senioridade}
                    </span>
                  ) : null}
                </label>
                <label className="block space-y-1">
                  <span className={labelBase}>{dict.labels.education}</span>
                  <select
                    className={cx(
                      inputBase,
                      profileTouched.escolaridade &&
                        profileErrors.escolaridade &&
                        inputError,
                    )}
                    value={form.escolaridade}
                    onChange={(e) => {
                      setProfileTouched((t) => ({ ...t, escolaridade: true }));
                      update("escolaridade", e.target.value);
                    }}
                    onBlur={() =>
                      setProfileTouched((t) => ({ ...t, escolaridade: true }))
                    }
                  >
                    <option value="">
                      {dict.profile.educationPlaceholder}
                    </option>
                    {PROFILE_EDUCATION_KEYS.map((k) => (
                      <option key={k} value={k}>
                        {dict.profile.education[k]}
                      </option>
                    ))}
                  </select>
                  {profileTouched.escolaridade && profileErrors.escolaridade ? (
                    <span className="block text-xs text-red-300/90">
                      {profileErrors.escolaridade}
                    </span>
                  ) : null}
                </label>

                <div
                  className="relative block space-y-1 sm:col-span-2"
                  ref={areaComboRef}
                >
                  <span className={labelBase}>{dict.labels.area}</span>
                  <input
                    className={cx(
                      inputBase,
                      "mt-1",
                      profileTouched.areaAtuacao &&
                        profileErrors.areaAtuacao &&
                        inputError,
                    )}
                    value={areaFieldDisplay}
                    onChange={(e) => {
                      const v = e.target.value;
                      setProfileTouched((t) => ({ ...t, areaAtuacao: true }));
                      setAreaListOpen(true);
                      setAreaFilter(v);
                      update("areaAtuacao", "");
                    }}
                    onFocus={() => {
                      setProfileTouched((t) => ({ ...t, areaAtuacao: true }));
                      setAreaListOpen(true);
                      const cur =
                        form.areaAtuacao && isProfileAreaKey(form.areaAtuacao)
                          ? dict.profile.area[form.areaAtuacao]
                          : "";
                      setAreaFilter(cur);
                    }}
                    placeholder={dict.profile.areaPlaceholder}
                    autoComplete="off"
                    aria-autocomplete="list"
                    aria-expanded={areaListOpen}
                  />
                  {areaListOpen ? (
                    <div
                      className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-zinc-800 bg-zinc-950 py-1 shadow-lg"
                      role="listbox"
                    >
                      {filteredProfileAreaKeys.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-zinc-500">
                          {dict.profile.areaNoResults}
                        </div>
                      ) : (
                        filteredProfileAreaKeys.map((key) => (
                          <button
                            key={key}
                            type="button"
                            role="option"
                            className="block w-full px-3 py-2 text-left text-sm text-zinc-200 hover:bg-zinc-900/80"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              update("areaAtuacao", key);
                              setAreaListOpen(false);
                              setAreaFilter("");
                              setProfileTouched((t) => ({
                                ...t,
                                areaAtuacao: true,
                              }));
                            }}
                          >
                            {dict.profile.area[key]}
                          </button>
                        ))
                      )}
                    </div>
                  ) : null}
                  {profileTouched.areaAtuacao && profileErrors.areaAtuacao ? (
                    <span className="block text-xs text-red-300/90">
                      {profileErrors.areaAtuacao}
                    </span>
                  ) : null}
                </div>

                <label className="block space-y-1">
                  <span className={labelBase}>{dict.labels.linkedin}</span>
                  <input
                    className={cx(
                      inputBase,
                      profileTouched.linkedin &&
                        profileErrors.linkedin &&
                        inputError,
                    )}
                    value={form.linkedin}
                    onChange={(e) => {
                      setProfileTouched((t) => ({ ...t, linkedin: true }));
                      update("linkedin", e.target.value);
                    }}
                    onBlur={() =>
                      setProfileTouched((t) => ({ ...t, linkedin: true }))
                    }
                    placeholder={dict.placeholders.linkedin}
                    inputMode="url"
                    autoComplete="url"
                  />
                  {profileTouched.linkedin && profileErrors.linkedin ? (
                    <span className="block text-xs text-red-300/90">
                      {profileErrors.linkedin}
                    </span>
                  ) : null}
                </label>
                <label className="block space-y-1">
                  <span className={labelBase}>{dict.labels.instagram}</span>
                  <input
                    className={inputBase}
                    value={form.instagram}
                    onChange={(e) =>
                      update(
                        "instagram",
                        normalizeInstagramInput(e.target.value),
                      )
                    }
                    placeholder={dict.placeholders.instagram}
                    autoComplete="username"
                  />
                </label>
              </div>
            ) : null}

            {step === 4 ? (
              <div className="space-y-4">
                <div className="text-sm font-medium text-zinc-200">
                  {dict.sections.coursesQuestion}
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {COURSE_OPTIONS.map((opt) => {
                    const checked = form.cursos.includes(opt);
                    return (
                      <label
                        key={opt}
                        className={cx(
                          "flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors",
                          checked
                            ? "border-violet-500/40 bg-violet-500/10"
                            : "border-zinc-800 hover:bg-zinc-900/40",
                        )}
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-violet-600"
                          checked={checked}
                          onChange={() => toggleCourse(opt)}
                        />
                        <span className="text-sm text-zinc-100">{opt}</span>
                      </label>
                    );
                  })}
                </div>
                {form.cursos.includes("Outros") ? (
                  <label className="block space-y-1">
                    <span className={labelBase}>{dict.labels.detail}</span>
                    <input
                      className={inputBase}
                      value={form.outrosDetalhe}
                      onChange={(e) => update("outrosDetalhe", e.target.value)}
                      placeholder={dict.placeholders.otherDetail}
                    />
                  </label>
                ) : null}
              </div>
            ) : null}

            {step === 5 ? (
              <div className="mx-auto w-full max-w-2xl space-y-5 sm:space-y-6">
                <section
                  className={cx(
                    "rounded-2xl border border-zinc-800/80 bg-zinc-950/55 p-5 sm:p-6",
                    "ring-1 ring-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
                  )}
                >
                  <div className="flex gap-4 sm:gap-5">
                    <input
                      id="cadastro-aceito-termos"
                      type="checkbox"
                      className="mt-1 h-4 w-4 shrink-0 accent-violet-500"
                      checked={form.aceitoTermos}
                      onChange={(e) =>
                        update("aceitoTermos", e.target.checked)
                      }
                    />
                    <div className="min-w-0 flex-1 space-y-3">
                      <div>
                        <label
                          htmlFor="cadastro-aceito-termos"
                          className="cursor-pointer text-sm font-semibold leading-snug text-zinc-100"
                        >
                          {dict.sections.legalTermsTitle}
                        </label>
                        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                          {dict.sections.legalTermsDesc}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="text-left text-sm font-medium text-violet-300/95 transition-colors hover:text-violet-200"
                        aria-expanded={legalTermsExpanded}
                        onClick={() =>
                          setLegalTermsExpanded((open) => !open)
                        }
                      >
                        {legalTermsExpanded
                          ? dict.sections.legalTermsToggleHide
                          : dict.sections.legalTermsToggleShow}
                      </button>
                      <div
                        className={cx(
                          "grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none",
                          legalTermsExpanded
                            ? "grid-rows-[1fr]"
                            : "grid-rows-[0fr]",
                        )}
                      >
                        <div className="min-h-0 overflow-hidden">
                          <div
                            className={cx(
                              "mt-1 max-h-[min(52vh,26rem)] overflow-y-auto overscroll-contain rounded-xl",
                              "border border-zinc-800/90 bg-zinc-950/90 px-4 py-3.5 sm:px-5",
                              "text-sm leading-relaxed text-zinc-300 [scrollbar-gutter:stable]",
                              !legalTermsExpanded && "pointer-events-none",
                            )}
                            role="region"
                            aria-label={dict.sections.legalTermsTitle}
                          >
                            <div className="whitespace-pre-wrap">
                              {dict.sections.legalTermsFull}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section
                  className={cx(
                    "rounded-2xl border border-zinc-800/80 bg-zinc-950/55 p-5 sm:p-6",
                    "ring-1 ring-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
                  )}
                >
                  <div className="flex gap-4 sm:gap-5">
                    <input
                      id="cadastro-aceito-privacidade"
                      type="checkbox"
                      className="mt-1 h-4 w-4 shrink-0 accent-violet-500"
                      checked={form.aceitoPrivacidade}
                      onChange={(e) =>
                        update("aceitoPrivacidade", e.target.checked)
                      }
                    />
                    <div className="min-w-0 flex-1 space-y-3">
                      <div>
                        <label
                          htmlFor="cadastro-aceito-privacidade"
                          className="cursor-pointer text-sm font-semibold leading-snug text-zinc-100"
                        >
                          {dict.sections.legalPrivacyTitle}
                        </label>
                        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                          {dict.sections.legalPrivacyDesc}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="text-left text-sm font-medium text-violet-300/95 transition-colors hover:text-violet-200"
                        aria-expanded={legalPrivacyExpanded}
                        onClick={() =>
                          setLegalPrivacyExpanded((open) => !open)
                        }
                      >
                        {legalPrivacyExpanded
                          ? dict.sections.legalPrivacyToggleHide
                          : dict.sections.legalPrivacyToggleShow}
                      </button>
                      <div
                        className={cx(
                          "grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none",
                          legalPrivacyExpanded
                            ? "grid-rows-[1fr]"
                            : "grid-rows-[0fr]",
                        )}
                      >
                        <div className="min-h-0 overflow-hidden">
                          <div
                            className={cx(
                              "mt-1 max-h-[min(52vh,26rem)] overflow-y-auto overscroll-contain rounded-xl",
                              "border border-zinc-800/90 bg-zinc-950/90 px-4 py-3.5 sm:px-5",
                              "text-sm leading-relaxed text-zinc-300 [scrollbar-gutter:stable]",
                              !legalPrivacyExpanded && "pointer-events-none",
                            )}
                            role="region"
                            aria-label={dict.sections.legalPrivacyTitle}
                          >
                            <div className="whitespace-pre-wrap">
                              {dict.sections.legalPrivacyFull}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            ) : null}
          </div>

          <div
            className={cx(
              "relative z-20 mt-10 flex items-center gap-3",
              "justify-center",
            )}
          >
            <div className="grid w-full grid-cols-3 items-center">
              <div className="justify-self-start">
                {step === 0 ? null : (
                  <button
                    type="button"
                    onClick={back}
                    disabled={step === 0 || isLoading}
                    className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-800 bg-zinc-950 px-4 text-sm font-medium text-zinc-100 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {dict.back}
                  </button>
                )}
              </div>

              <div className="justify-self-center">
                {step < 5 ? (
                  <button
                    type="button"
                    onClick={next}
                    disabled={isLoading}
                    className="inline-flex h-14 w-56 items-center justify-center gap-3 rounded-xl bg-gradient-to-b from-violet-500 to-violet-700 text-sm font-medium text-white shadow-[0_10px_30px_rgba(124,58,237,0.35)] hover:from-violet-400 hover:to-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {dict.continue}
                    <span className="text-lg leading-none" aria-hidden="true">
                      →
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void finish()}
                    disabled={isLoading}
                    className="inline-flex h-14 w-56 items-center justify-center rounded-xl bg-gradient-to-b from-violet-500 to-violet-700 text-sm font-medium text-white shadow-[0_10px_30px_rgba(124,58,237,0.35)] hover:from-violet-400 hover:to-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isLoading ? dict.finishing : dict.createAccount}
                  </button>
                )}
              </div>

              <div />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

