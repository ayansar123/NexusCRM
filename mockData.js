const DEFAULT_CONTACTS = [
  {
    id: "c1",
    name: "Sarah Jenkins",
    email: "sarah.jenkins@acmecorp.com",
    phone: "+1 (555) 234-5678",
    company: "Acme Corporation",
    status: "Customer",
    value: 12500,
    tags: ["Enterprise", "Tech"],
    dateCreated: "2026-01-15"
  },
  {
    id: "c2",
    name: "David Chen",
    email: "dchen@innovatesolutions.io",
    phone: "+1 (555) 876-5432",
    company: "Innovate Solutions",
    status: "Lead",
    value: 5000,
    tags: ["Startup", "SaaS"],
    dateCreated: "2026-05-10"
  },
  {
    id: "c3",
    name: "Elena Rostova",
    email: "elena.rostova@nexusgroup.com",
    phone: "+44 20 7946 0192",
    company: "Nexus Group",
    status: "Contact",
    value: 8200,
    tags: ["International", "Fintech"],
    dateCreated: "2026-03-22"
  },
  {
    id: "c4",
    name: "Marcus Aurelius",
    email: "marcus@mediterraneandecor.com",
    phone: "+39 06 1234567",
    company: "Mediterranean Import Co.",
    status: "Customer",
    value: 15000,
    tags: ["Retail", "Legacy"],
    dateCreated: "2025-11-04"
  },
  {
    id: "c5",
    name: "Olivia Vance",
    email: "olivia@vancemedia.com",
    phone: "+1 (555) 432-1098",
    company: "Vance Media",
    status: "Lead",
    value: 3200,
    tags: ["Marketing", "SMB"],
    dateCreated: "2026-06-01"
  },
  {
    id: "c6",
    name: "Jonathan Wright",
    email: "jwright@apexlogistics.net",
    phone: "+1 (555) 901-2345",
    company: "Apex Logistics",
    status: "Inactive",
    value: 0,
    tags: ["Logistics"],
    dateCreated: "2025-08-19"
  }
];

const DEFAULT_DEALS = [
  {
    id: "d1",
    title: "Cloud Infrastructure Migration",
    contactId: "c1",
    contactName: "Sarah Jenkins",
    value: 12500,
    stage: "won",
    closeDate: "2026-02-28",
    priority: "high",
    dateCreated: "2026-01-20"
  },
  {
    id: "d2",
    title: "SaaS Enterprise Licensing",
    contactId: "c2",
    contactName: "David Chen",
    value: 5000,
    stage: "qualification",
    closeDate: "2026-08-15",
    priority: "medium",
    dateCreated: "2026-05-12"
  },
  {
    id: "d3",
    title: "Security Audit & Compliance Consulting",
    contactId: "c3",
    contactName: "Elena Rostova",
    value: 8200,
    stage: "negotiation",
    closeDate: "2026-07-10",
    priority: "high",
    dateCreated: "2026-04-01"
  },
  {
    id: "d4",
    title: "Annual Product Supply Contract",
    contactId: "c4",
    contactName: "Marcus Aurelius",
    value: 15000,
    stage: "won",
    closeDate: "2026-01-10",
    priority: "low",
    dateCreated: "2025-11-10"
  },
  {
    id: "d5",
    title: "Q3 Campaign Advisory Services",
    contactId: "c5",
    contactName: "Olivia Vance",
    value: 3200,
    stage: "proposal",
    closeDate: "2026-07-30",
    priority: "low",
    dateCreated: "2026-06-05"
  }
];

const DEFAULT_TASKS = [
  {
    id: "t1",
    title: "Send cloud migration contract details",
    associatedType: "contact",
    associatedId: "c1",
    associatedName: "Sarah Jenkins",
    dueDate: "2026-06-25",
    priority: "high",
    status: "pending",
    dateCreated: "2026-06-20"
  },
  {
    id: "t2",
    title: "Follow up on initial intro call feedback",
    associatedType: "contact",
    associatedId: "c2",
    associatedName: "David Chen",
    dueDate: "2026-06-28",
    priority: "medium",
    status: "pending",
    dateCreated: "2026-06-22"
  },
  {
    id: "t3",
    title: "Prepare custom compliance proposal PDF",
    associatedType: "deal",
    associatedId: "d3",
    associatedName: "Security Audit & Compliance Consulting",
    dueDate: "2026-06-24",
    priority: "high",
    status: "pending",
    dateCreated: "2026-06-18"
  },
  {
    id: "t4",
    title: "Schedule quarterly review call",
    associatedType: "contact",
    associatedId: "c4",
    associatedName: "Marcus Aurelius",
    dueDate: "2026-06-10",
    priority: "low",
    status: "completed",
    dateCreated: "2026-06-01"
  }
];

const DEFAULT_INTERACTIONS = [
  {
    id: "i1",
    contactId: "c1",
    contactName: "Sarah Jenkins",
    type: "email",
    details: "Sent welcome email and details regarding cloud migration timelines.",
    dateLogged: "2026-01-16T10:15:00"
  },
  {
    id: "i2",
    contactId: "c1",
    contactName: "Sarah Jenkins",
    type: "call",
    details: "Discussed scoping requirements. Client is very enthusiastic about migrating before Q2.",
    dateLogged: "2026-01-20T14:30:00"
  },
  {
    id: "i3",
    contactId: "c2",
    contactName: "David Chen",
    type: "meeting",
    details: "Discovery call. Discussed their SaaS needs and user count (approx 150 seats). Sent pricing model.",
    dateLogged: "2026-05-12T11:00:00"
  },
  {
    id: "i4",
    contactId: "c3",
    contactName: "Elena Rostova",
    type: "email",
    details: "Answered questions about security compliance checklists. Under review by their legal team.",
    dateLogged: "2026-04-15T09:45:00"
  },
  {
    id: "i5",
    contactId: "c5",
    contactName: "Olivia Vance",
    type: "call",
    details: "Initial call. Olivia inquired about SMB marketing campaigns. Set up to send custom proposal.",
    dateLogged: "2026-06-05T16:20:00"
  }
];

// Export standard mock data structures
window.CRM_SEED_DATA = {
  contacts: DEFAULT_CONTACTS,
  deals: DEFAULT_DEALS,
  tasks: DEFAULT_TASKS,
  interactions: DEFAULT_INTERACTIONS
};
