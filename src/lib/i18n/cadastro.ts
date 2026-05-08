import type { UiLocale } from "@/lib/countries";

type Dict = {
  title: string;
  subtitle: string;
  stepSubtitle: string;
  stepHeaders: {
    access: string;
    personal: string;
    profile: string;
    history: string;
    legal: string;
  };
  selectCountryTitle: string;
  selectCountrySubtitle: string;
  countryBrazil: string;
  countryInternational: string;
  selectCountryModalTitle: string;
  searchPlaceholder: string;
  close: string;
  continue: string;
  back: string;
  createAccount: string;
  finishing: string;
  signingUp: string;

  labels: {
    email: string;
    password: string;
    confirmPassword: string;
    fullName: string;
    socialName: string;
    useSocialName: string;
    addContactPhone: string;
    documentCpf: string;
    documentIntl: string;
    personalPhone: string;
    contactPhone: string;
    contactName: string;
    address: string;
    cep: string;
    maritalStatus: string;
    seniority: string;
    education: string;
    area: string;
    linkedin: string;
    instagram: string;
    detail: string;
  };

  marital: {
    placeholder: string;
    solteiro: string;
    casado: string;
    divorciado: string;
    viuvo: string;
    uniao_estavel: string;
  };

  profile: {
    seniorityPlaceholder: string;
    educationPlaceholder: string;
    areaPlaceholder: string;
    areaNoResults: string;
    seniority: {
      estagiario: string;
      junior: string;
      pleno: string;
      senior: string;
      especialista: string;
      gestor: string;
    };
    education: {
      medio_incompleto: string;
      medio_completo: string;
      superior_incompleto: string;
      superior_completo: string;
      pos: string;
      mestrado: string;
      doutorado: string;
    };
    area: {
      tech_ti: string;
      dados_analytics: string;
      marketing: string;
      vendas: string;
      financeiro: string;
      rh: string;
      engenharia: string;
      educacao: string;
      saude: string;
      juridico: string;
      administracao: string;
      logistica: string;
      design: string;
      produto: string;
      outro: string;
    };
  };

  placeholders: {
    linkedin: string;
    instagram: string;
    otherDetail: string;
  };

  sections: {
    coursesQuestion: string;
    legalTermsTitle: string;
    legalTermsDesc: string;
    legalPrivacyTitle: string;
    legalPrivacyDesc: string;
    legalTermsToggleShow: string;
    legalTermsToggleHide: string;
    legalPrivacyToggleShow: string;
    legalPrivacyToggleHide: string;
    legalTermsFull: string;
    legalPrivacyFull: string;
  };

  messages: {
    chooseCountry: string;
    fillAccessFields: string;
    fillEmailPassword: string;
    invalidEmail: string;
    invalidPassword: string;
    passwordMismatch: string;
    enterName: string;
    enterCpf: string;
    enterDocument: string;
    enterPhone: string;
    fillPersonalFields: string;
    fullNameInvalid: string;
    invalidCpf: string;
    invalidCep: string;
    invalidPostalCode: string;
    invalidPersonalPhone: string;
    maritalRequired: string;
    addressRequired: string;
    contactPhoneRequired: string;
    contactNameRequired: string;
    fillProfileFields: string;
    seniorityRequired: string;
    educationRequired: string;
    areaRequired: string;
    invalidLinkedin: string;
    detailOther: string;
    acceptLegal: string;
    checkEmailConfirm: string;
    draftSaveFailed: string;
    verifyFields: string;
    signUpAuthFailed: string;
  };
};

const PT_BR: Dict = {
  title: "Cadastro",
  subtitle: "Crie sua conta e complete seu perfil",
  stepSubtitle: "Complete as informações para continuar",
  stepHeaders: {
    access: "ACESSO",
    personal: "DADOS PESSOAIS",
    profile: "PERFIL",
    history: "HISTÓRICO",
    legal: "JURÍDICO",
  },
  selectCountryTitle: "CADASTRO",
  selectCountrySubtitle: "Selecione o país para continuar",
  countryBrazil: "Brasil",
  countryInternational: "Internacional",
  selectCountryModalTitle: "Selecione um país",
  searchPlaceholder: "Buscar...",
  close: "Fechar",
  continue: "Continuar",
  back: "Voltar",
  createAccount: "Criar conta",
  finishing: "Finalizando...",
  signingUp: "Criando conta...",
  labels: {
    email: "E-mail",
    password: "Senha",
    confirmPassword: "Confirmar senha",
    fullName: "Nome completo",
    socialName: "Nome social",
    useSocialName: "Deseja informar nome social?",
    addContactPhone: "Adicionar telefone para contato?",
    documentCpf: "CPF",
    documentIntl: "Documento internacional",
    personalPhone: "Telefone pessoal",
    contactPhone: "Telefone para contato",
    contactName: "Nome do contato",
    address: "Endereço",
    cep: "CEP",
    maritalStatus: "Estado civil",
    seniority: "Nível de senioridade",
    education: "Nível de escolaridade",
    area: "Área de atuação",
    linkedin: "LinkedIn",
    instagram: "Instagram",
    detail: "Detalhe",
  },
  marital: {
    placeholder: "Selecione",
    solteiro: "Solteiro(a)",
    casado: "Casado(a)",
    divorciado: "Divorciado(a)",
    viuvo: "Viúvo(a)",
    uniao_estavel: "União estável",
  },
  profile: {
    seniorityPlaceholder: "Selecione",
    educationPlaceholder: "Selecione",
    areaPlaceholder: "Busque ou selecione a área",
    areaNoResults: "Nenhum resultado",
    seniority: {
      estagiario: "Estagiário",
      junior: "Júnior",
      pleno: "Pleno",
      senior: "Sênior",
      especialista: "Especialista",
      gestor: "Gestor",
    },
    education: {
      medio_incompleto: "Ensino médio incompleto",
      medio_completo: "Ensino médio completo",
      superior_incompleto: "Ensino superior incompleto",
      superior_completo: "Ensino superior completo",
      pos: "Pós-graduação",
      mestrado: "Mestrado",
      doutorado: "Doutorado",
    },
    area: {
      tech_ti: "Tecnologia / TI",
      dados_analytics: "Dados / Analytics",
      marketing: "Marketing",
      vendas: "Vendas",
      financeiro: "Financeiro",
      rh: "Recursos Humanos",
      engenharia: "Engenharia",
      educacao: "Educação",
      saude: "Saúde",
      juridico: "Jurídico",
      administracao: "Administração",
      logistica: "Logística",
      design: "Design",
      produto: "Produto",
      outro: "Outro",
    },
  },
  placeholders: {
    linkedin: "https://linkedin.com/in/...",
    instagram: "@usuario",
    otherDetail: "Conte quais cursos/treinamentos",
  },
  sections: {
    coursesQuestion: "Quais cursos já fez com a Yto Nihon?",
    legalTermsTitle: "Aceito os termos (obrigatório)",
    legalTermsDesc: "Confirmação necessária para criar sua conta.",
    legalPrivacyTitle: "Aceito a política de privacidade / LGPD (obrigatório)",
    legalPrivacyDesc: "Tratamento de dados conforme a política.",
    legalTermsToggleShow: "Ver termos completos",
    legalTermsToggleHide: "Recolher termos",
    legalPrivacyToggleShow: "Ver política de privacidade",
    legalPrivacyToggleHide: "Recolher política",
    legalTermsFull: `TERMOS DE USO — PORTAL DO ALUNO (YTO NIHON)

1. Objeto e aceitação
Estes Termos de Uso regulam o acesso e a utilização do portal do aluno, incluindo cadastro, login e funcionalidades associadas. Ao marcar a opção de aceite, você declara que leu, compreendeu e concorda com estes termos.

2. Cadastro e conta
Você se compromete a fornecer informações verdadeiras, completas e atualizadas. É responsável por manter a confidencialidade das credenciais de acesso e por todas as atividades realizadas na sua conta.

3. Uso permitido
O portal destina-se ao uso relacionado à sua relação com a Yto Nihon (cursos, comunicações e serviços educacionais). É vedado o uso para fins ilícitos, que violem direitos de terceiros ou que comprometam a segurança ou o funcionamento da plataforma.

4. Conteúdo e propriedade intelectual
Materiais disponibilizados (textos, marcas, layout, vídeos, exercícios, entre outros) são protegidos por direitos de propriedade intelectual. Salvo autorização expressa, não é permitida a reprodução, distribuição ou engenharia reversa não autorizada.

5. Suspensão e encerramento
Podemos suspender ou encerrar o acesso em caso de violação destes termos, suspeita de fraude, ordem legal ou necessidade técnica, sempre que possível com comunicação prévia, salvo quando impossível ou vedado por lei.

6. Limitação de responsabilidade
Na medida permitida pela lei aplicável, o uso do portal é fornecido “no estado em que se encontra”. Indisponibilidades temporárias, falhas de rede ou de terceiros podem ocorrer; adotaremos medidas razoáveis para restabelecimento.

7. Alterações
Estes termos podem ser atualizados. A versão vigente estará disponível no cadastro e o uso continuado após alterações pode significar sua concordância, conforme avisos aplicáveis.

8. Contato
Para dúvidas sobre estes termos, utilize os canais oficiais de atendimento informados pela Yto Nihon.

Última atualização: referência genérica para cadastro — substitua por data/versão oficial quando publicar o documento jurídico definitivo.`,
    legalPrivacyFull: `POLÍTICA DE PRIVACIDADE E PROTEÇÃO DE DADOS (LGPD)

1. Controlador e encarregado
A Yto Nihon atua como controladora dos dados pessoais tratados no contexto do portal do aluno, conforme definições legais aplicáveis. Quando houver encarregado (DPO) nomeado, os contatos serão divulgados nos canais oficiais.

2. Dados coletados
Podemos tratar dados de identificação, contato, perfil profissional/educacional, dados de navegação (logs, cookies, quando aplicável), além de informações necessárias à prestação dos serviços contratados ou solicitados por você.

3. Finalidades
Os dados são utilizados para: criar e manter sua conta; autenticar acesso; prestar suporte; cumprir obrigações legais; melhorar produtos e experiência; comunicar atualizações relevantes; prevenir fraudes e garantir segurança.

4. Bases legais
O tratamento poderá se fundamentar em execução de contrato, consentimento (quando exigido), cumprimento de obrigação legal/regulatória, legítimo interesse (com avaliação de balanceamento e direitos do titular), entre outras previstas na LGPD.

5. Compartilhamento
Podemos compartilhar dados com provedores de tecnologia (hospedagem, autenticação, e-mail), autoridades competentes quando exigido por lei, ou parceiros necessários à operação, mediante contratos e medidas de segurança adequadas.

6. Retenção
Mantemos os dados pelo tempo necessário para as finalidades informadas, respeitando prazos legais e políticas de retenção documentadas internamente.

7. Direitos do titular
Você pode solicitar confirmação de tratamento, acesso, correção, anonimização, portabilidade (quando aplicável), eliminação de dados desnecessários, informação sobre compartilhamentos e revogação de consentimento, quando o tratamento depender dele, nos termos da LGPD.

8. Segurança
Adotamos medidas técnicas e administrativas razoáveis para proteger os dados contra acessos não autorizados, perda ou alteração indevida. Nenhum sistema é 100% seguro; recomendamos o uso de senha forte e a proteção do dispositivo.

9. Cookies e tecnologias similares
Quando utilizados, serão descritos em aviso específico, com opções de gestão quando exigido pela regulamentação aplicável.

10. Atualizações
Esta política pode ser atualizada para refletir mudanças legais ou operacionais. O aceite no cadastro refere-se à versão apresentada no momento do envio do formulário.

Texto de referência para o fluxo de cadastro — alinhe com o documento jurídico aprovado pela empresa antes da produção.`,
  },
  messages: {
    chooseCountry: "Selecione um país.",
    fillAccessFields: "Preencha e-mail e senha.",
    fillEmailPassword: "Preencha e-mail e senha.",
    invalidEmail: "Digite um e-mail válido",
    invalidPassword:
      "Senha inválida: use 6–12 caracteres, apenas letras, números e !@#$%&*()_-+=",
    passwordMismatch: "As senhas não coincidem",
    enterName: "Informe seu nome.",
    enterCpf: "Informe seu CPF.",
    enterDocument: "Informe seu documento.",
    enterPhone: "Informe seu telefone pessoal.",
    fillPersonalFields: "Corrija os dados pessoais para continuar.",
    fullNameInvalid: "Digite seu nome completo",
    invalidCpf: "Digite um CPF válido",
    invalidCep: "Digite um CEP válido",
    invalidPostalCode: "Informe um código postal válido",
    invalidPersonalPhone: "Informe um telefone válido",
    maritalRequired: "Selecione o estado civil",
    addressRequired: "Informe o endereço",
    contactPhoneRequired: "Informe o telefone para contato",
    contactNameRequired: "Informe o nome do contato",
    fillProfileFields: "Corrija os dados do perfil para continuar.",
    seniorityRequired: "Selecione o nível de senioridade",
    educationRequired: "Selecione o nível de escolaridade",
    areaRequired: "Selecione a área de atuação",
    invalidLinkedin: "Digite um LinkedIn válido",
    detailOther: 'Detalhe a opção "Outros".',
    acceptLegal: "Aceite os termos e a política.",
    checkEmailConfirm: "Conta criada. Verifique seu e-mail para confirmar o acesso.",
    draftSaveFailed: "Não foi possível salvar o rascunho do cadastro.",
    verifyFields: "Verifique os campos.",
    signUpAuthFailed:
      "Não foi possível criar sua conta de acesso (autenticação). Motivo:",
  },
};

const EN: Dict = {
  title: "Sign up",
  subtitle: "Create your account and complete your profile",
  stepSubtitle: "Complete the information to continue",
  stepHeaders: {
    access: "ACCESS",
    personal: "PERSONAL DATA",
    profile: "PROFILE",
    history: "HISTORY",
    legal: "LEGAL",
  },
  selectCountryTitle: "SIGN UP",
  selectCountrySubtitle: "Select a country to continue",
  countryBrazil: "Brazil",
  countryInternational: "International",
  selectCountryModalTitle: "Select a country",
  searchPlaceholder: "Search...",
  close: "Close",
  continue: "Continue",
  back: "Back",
  createAccount: "Create account",
  finishing: "Finishing...",
  signingUp: "Creating account...",
  labels: {
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm password",
    fullName: "Full name",
    socialName: "Preferred name",
    useSocialName: "Add a preferred name?",
    addContactPhone: "Add a contact phone?",
    documentCpf: "CPF",
    documentIntl: "International document",
    personalPhone: "Personal phone",
    contactPhone: "Contact phone",
    contactName: "Contact name",
    address: "Address",
    cep: "ZIP / postal code",
    maritalStatus: "Marital status",
    seniority: "Seniority",
    education: "Education level",
    area: "Area of expertise",
    linkedin: "LinkedIn",
    instagram: "Instagram",
    detail: "Detail",
  },
  marital: {
    placeholder: "Select",
    solteiro: "Single",
    casado: "Married",
    divorciado: "Divorced",
    viuvo: "Widowed",
    uniao_estavel: "Domestic partnership",
  },
  profile: {
    seniorityPlaceholder: "Select",
    educationPlaceholder: "Select",
    areaPlaceholder: "Search or select an area",
    areaNoResults: "No results",
    seniority: {
      estagiario: "Intern",
      junior: "Junior",
      pleno: "Mid-level",
      senior: "Senior",
      especialista: "Specialist",
      gestor: "Manager",
    },
    education: {
      medio_incompleto: "Incomplete high school",
      medio_completo: "High school graduate",
      superior_incompleto: "Incomplete higher education",
      superior_completo: "Higher education complete",
      pos: "Postgraduate",
      mestrado: "Master's",
      doutorado: "Doctorate",
    },
    area: {
      tech_ti: "Technology / IT",
      dados_analytics: "Data / Analytics",
      marketing: "Marketing",
      vendas: "Sales",
      financeiro: "Finance",
      rh: "Human Resources",
      engenharia: "Engineering",
      educacao: "Education",
      saude: "Healthcare",
      juridico: "Legal",
      administracao: "Administration",
      logistica: "Logistics",
      design: "Design",
      produto: "Product",
      outro: "Other",
    },
  },
  placeholders: {
    linkedin: "https://linkedin.com/in/...",
    instagram: "@username",
    otherDetail: "Describe which courses/trainings",
  },
  sections: {
    coursesQuestion: "Which courses have you taken with Yto Nihon?",
    legalTermsTitle: "I accept the terms (required)",
    legalTermsDesc: "Confirmation required to create your account.",
    legalPrivacyTitle: "I accept the privacy policy (required)",
    legalPrivacyDesc: "Data processing according to the policy.",
    legalTermsToggleShow: "View full terms",
    legalTermsToggleHide: "Hide terms",
    legalPrivacyToggleShow: "View privacy policy",
    legalPrivacyToggleHide: "Hide policy",
    legalTermsFull: `TERMS OF USE — STUDENT PORTAL (YTO NIHON)

1. Purpose and acceptance
These Terms govern access to and use of the student portal, including registration, sign-in, and related features. By checking the acceptance box, you confirm that you have read, understood, and agree to these Terms.

2. Registration and account
You agree to provide accurate, complete, and up-to-date information. You are responsible for keeping your credentials confidential and for all activity under your account.

3. Permitted use
The portal is intended for use related to your relationship with Yto Nihon (courses, communications, and educational services). Unlawful use, infringement of third-party rights, or actions that compromise security or availability are prohibited.

4. Content and intellectual property
Materials made available (text, trademarks, layout, videos, exercises, etc.) are protected by intellectual property laws. Unless expressly authorized, copying, redistribution, or unauthorized reverse engineering is not allowed.

5. Suspension and termination
We may suspend or terminate access in case of breach of these Terms, suspected fraud, legal requirement, or technical necessity, with prior notice when feasible unless prohibited by law.

6. Limitation of liability
To the fullest extent permitted by applicable law, the portal is provided “as is.” Temporary outages, network failures, or third-party issues may occur; we will take reasonable steps to restore service.

7. Changes
These Terms may be updated. The current version will be available during registration, and continued use after changes may constitute acceptance, subject to applicable notices.

8. Contact
For questions about these Terms, use the official support channels provided by Yto Nihon.

Last updated: placeholder for registration flow — replace with the official legal version before production.`,
    legalPrivacyFull: `PRIVACY POLICY AND DATA PROTECTION (LGPD-STYLE NOTICE)

1. Controller
Yto Nihon acts as the controller of personal data processed in the context of the student portal, as defined under applicable law. If a DPO is appointed, contact details will be published through official channels.

2. Data collected
We may process identification and contact data, professional/educational profile data, navigation data (logs, cookies where applicable), and information necessary to deliver contracted or requested services.

3. Purposes
Data is used to: create and maintain your account; authenticate access; provide support; comply with legal obligations; improve products and experience; communicate relevant updates; prevent fraud and ensure security.

4. Legal bases
Processing may rely on contract performance, consent (where required), legal/regulatory obligations, legitimate interests (with balancing and rights safeguards), and other bases provided by applicable law.

5. Sharing
We may share data with technology providers (hosting, authentication, email), competent authorities when legally required, or partners necessary for operations, under contracts and appropriate security measures.

6. Retention
We retain data for as long as necessary for the stated purposes, respecting legal deadlines and internal retention policies.

7. Data subject rights
You may request confirmation of processing, access, correction, anonymization, portability (where applicable), deletion of unnecessary data, information about sharing, and withdrawal of consent when processing is based on consent, as provided by law.

8. Security
We adopt reasonable technical and administrative measures to protect data against unauthorized access, loss, or improper alteration. No system is 100% secure; use a strong password and protect your device.

9. Cookies and similar technologies
Where used, they will be described in a dedicated notice with management options when required by applicable regulation.

10. Updates
This policy may be updated to reflect legal or operational changes. Acceptance during registration refers to the version presented at submission time.

Reference text for the registration flow — align with the company’s approved legal document before production.`,
  },
  messages: {
    chooseCountry: "Select a country.",
    fillAccessFields: "Enter email and password.",
    fillEmailPassword: "Fill in email and password.",
    invalidEmail: "Enter a valid email",
    invalidPassword:
      "Invalid password: use 6–12 characters with only letters, numbers, and !@#$%&*()_-+=",
    passwordMismatch: "Passwords do not match",
    enterName: "Enter your name.",
    enterCpf: "Enter your CPF.",
    enterDocument: "Enter your document.",
    enterPhone: "Enter your phone.",
    fillPersonalFields: "Please fix your personal details to continue.",
    fullNameInvalid: "Enter your full name",
    invalidCpf: "Enter a valid CPF",
    invalidCep: "Enter a valid postal code",
    invalidPostalCode: "Enter a valid postal code",
    invalidPersonalPhone: "Enter a valid phone number",
    maritalRequired: "Select your marital status",
    addressRequired: "Enter your address",
    contactPhoneRequired: "Enter the contact phone",
    contactNameRequired: "Enter the contact name",
    fillProfileFields: "Please fix your profile details to continue.",
    seniorityRequired: "Select your seniority level",
    educationRequired: "Select your education level",
    areaRequired: "Select your area of expertise",
    invalidLinkedin: "Enter a valid LinkedIn URL",
    detailOther: 'Please detail "Other".',
    acceptLegal: "Accept terms and privacy policy.",
    checkEmailConfirm: "Account created. Check your email to confirm access.",
    draftSaveFailed: "Could not save the sign-up draft.",
    verifyFields: "Please review the fields.",
    signUpAuthFailed:
      "Could not create your access account (authentication). Reason:",
  },
};

const ES: Dict = {
  ...EN,
  title: "Registro",
  subtitle: "Crea tu cuenta y completa tu perfil",
  stepSubtitle: "Completa la información para continuar",
  stepHeaders: {
    access: "ACCESO",
    personal: "DATOS PERSONALES",
    profile: "PERFIL",
    history: "HISTORIAL",
    legal: "LEGAL",
  },
  selectCountryTitle: "REGISTRO",
  selectCountrySubtitle: "Selecciona un país para continuar",
  searchPlaceholder: "Buscar...",
  close: "Cerrar",
  continue: "Continuar",
  back: "Volver",
  createAccount: "Crear cuenta",
};

const FR: Dict = {
  ...EN,
  title: "Inscription",
  subtitle: "Créez votre compte et complétez votre profil",
  stepSubtitle: "Complétez les informations pour continuer",
  stepHeaders: {
    access: "ACCÈS",
    personal: "DONNÉES PERSONNELLES",
    profile: "PROFIL",
    history: "HISTORIQUE",
    legal: "JURIDIQUE",
  },
  selectCountryTitle: "INSCRIPTION",
  selectCountrySubtitle: "Sélectionnez un pays pour continuer",
  searchPlaceholder: "Rechercher...",
  close: "Fermer",
  continue: "Continuer",
  back: "Retour",
  createAccount: "Créer un compte",
};

const JA: Dict = {
  ...EN,
  title: "登録",
  subtitle: "アカウントを作成してプロフィールを完成させましょう",
  stepSubtitle: "続行するには情報を入力してください",
  stepHeaders: {
    access: "アクセス",
    personal: "個人情報",
    profile: "プロフィール",
    history: "履歴",
    legal: "規約",
  },
  selectCountryTitle: "登録",
  selectCountrySubtitle: "国を選択して続行してください",
  searchPlaceholder: "検索...",
  close: "閉じる",
  continue: "続行",
  back: "戻る",
  createAccount: "アカウント作成",
};

const PT_PT: Dict = {
  ...PT_BR,
  title: "Registo",
  subtitle: "Crie a sua conta e complete o seu perfil",
};

export function getCadastroDict(locale: UiLocale): Dict {
  switch (locale) {
    case "pt-BR":
      return PT_BR;
    case "pt-PT":
      return PT_PT;
    case "es":
      return ES;
    case "fr":
      return FR;
    case "ja":
      return JA;
    case "en":
    default:
      return EN;
  }
}

