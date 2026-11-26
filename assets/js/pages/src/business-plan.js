// Readable owner restored from the maintained runtime; generated output is owned by scripts/minify.js.
!function() {
    "use strict";
    var bpLocale = document.documentElement.lang === "ha" ? window.AfroBusinessPlanHausa : null;
    function bpText(text) { return bpLocale ? bpLocale.text(text) : text; }

    function savedFailure(error) {
        var message = bpLocale ? bpLocale.text(window.SaveState.message(error, "en")) : window.SaveState.message(error), list = document.getElementById("savedPlans");
        var panel = document.getElementById("savedPanel");
        if (panel) panel.hidden = false;
        var status = document.getElementById("savedStorageStatus");
        if (!status && list) { status = document.createElement("p"); status.id = "savedStorageStatus"; status.setAttribute("role", "status"); list.parentNode.insertBefore(status, list); }
        if (status) status.textContent = message;
        V(message);
    }
    function clearSavedFailure() { var status = document.getElementById("savedStorageStatus"); if (status) status.remove(); }
    function readSavedItem(id) {
        try { var item = n.load(id); clearSavedFailure(); return item; }
        catch (error) { savedFailure(error); return false; }
    }
    function deleteSavedItem(id) {
        try { var deleted = n.delete(id); clearSavedFailure(); return deleted; }
        catch (error) { savedFailure(error); return false; }
    }
    function focusSavedAction() {
        var target = document.querySelector('#savedPlans button') || document.querySelector('#savePlanBtn');
        if (target) target.focus();
    }


    function importRecord(value) {
        if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid document backup");
        Object.keys(value).forEach(function(key) {
            if (["__proto__", "prototype", "constructor"].includes(key)) throw new Error("Invalid document backup");
            var child = value[key];
            if (child && typeof child === "object") {
                if (Array.isArray(child)) child.forEach(function(item) { if (item && typeof item === "object") importRecord(item); });
                else importRecord(child);
            }
        });
        return value;
    }
    function numericBackupValue(value) {
        return (typeof value === "number" || typeof value === "string") && Number.isFinite(Number(value));
    }
    function requireBackup(condition) {
        if (!condition) throw new Error("Invalid document backup");
    }
    function validateDocumentBackup(value) {
        importRecord(value);
        var data = Object.prototype.hasOwnProperty.call(value, "data") ? value.data : value;
        requireBackup(value.version === undefined || value.version === 2);
        importRecord(data);
        // The existing owner migrates this named, flat legacy business-plan schema.
        if (!data.meta && !data.sections && !data.financials) {
            requireBackup(typeof data.legalName === "string" || typeof data.businessName === "string");
            requireBackup(["overview", "mission", "offerings", "targetMarket", "fin_revenue_y1"].some(function(key) { return Object.prototype.hasOwnProperty.call(data, key); }));
            Object.keys(data).filter(function(key) { return /^fin_/.test(key); }).forEach(function(key) { requireBackup(numericBackupValue(data[key])); });
            return data;
        }
        importRecord(data.meta); importRecord(data.sections); importRecord(data.financials);
        requireBackup(typeof data.meta.currency === "string");
        ["company", "market", "products", "marketing", "operations", "milestones", "funding", "risks"].forEach(function(key) { importRecord(data.sections[key]); });
        ["revenue", "cogs", "opex", "salaries", "marketing", "capex"].forEach(function(key) {
            requireBackup(Array.isArray(data.financials[key]) && data.financials[key].every(numericBackupValue));
        });
        return data;
    }

    var e, t = "afrotools-business-plan-current-v2" + (bpLocale ? ":ha" : ""), n = window.SaveState ? new window.SaveState(bpLocale ? "business-plan-ha" : "business-plan", {
        maxFree: 30
    }) : null, a = 0, i = null, r = null, s = {
        NGN: "₦",
        KES: "KSh",
        GHS: "GH₵",
        ZAR: "R",
        TZS: "TSh",
        UGX: "USh",
        RWF: "FRw",
        ETB: "Br",
        EGP: "E£",
        MAD: "MAD",
        XOF: "CFA",
        XAF: "FCFA",
        USD: "$"
    }, o = {
        Nigeria: "NGN",
        Kenya: "KES",
        Ghana: "GHS",
        "South Africa": "ZAR",
        Tanzania: "TZS",
        Uganda: "UGX",
        Rwanda: "RWF",
        Ethiopia: "ETB",
        Egypt: "EGP",
        Morocco: "MAD",
        Senegal: "XOF",
        Cameroon: "XAF",
        "Pan-African": "USD"
    }, c = {
        blank: {
            label: bpText("Blank"),
            sector: "",
            data: {}
        },
        restaurant: {
            label: bpText("Restaurant"),
            sector: bpText("Food and hospitality"),
            data: {
                meta: {
                    industry: bpText("Restaurant"),
                    format: "lender"
                },
                sections: {
                    company: {
                        name: bpText("New Restaurant Venture"),
                        concept: bpText("A neighborhood restaurant serving high-quality local meals with reliable takeaway and catering options.")
                    },
                    market: {
                        targetCustomers: bpText("Office workers, families, students, event hosts, and nearby residents who want dependable meals at accessible prices."),
                        competitors: bpText("Quick-service restaurants, informal food vendors, hotel restaurants, and delivery-only kitchens."),
                        advantage: bpText("Consistent quality, clean service, delivery partnerships, menu discipline, and strong local sourcing.")
                    },
                    products: {
                        offer: bpText("Dine-in meals, takeaway packs, catering trays, drinks, and weekend specials."),
                        pricing: bpText("Mid-market pricing with bundle meals, event packages, and controlled food-cost margins.")
                    },
                    operations: {
                        suppliers: bpText("Local farms, meat and poultry suppliers, beverage distributors, packaging suppliers, and delivery partners."),
                        staffing: bpText("Chef, kitchen assistants, cashier, service attendants, cleaner, and part-time event support.")
                    }
                },
                financials: {
                    revenue: [ 48e6, 72e6, 98e6 ],
                    cogs: [ 192e5, 2736e4, 3724e4 ],
                    opex: [ 12e6, 156e5, 198e5 ],
                    salaries: [ 96e5, 126e5, 162e5 ],
                    marketing: [ 24e5, 36e5, 49e5 ]
                }
            }
        },
        tech: {
            label: bpText("Tech startup"),
            sector: bpText("Technology"),
            data: {
                meta: {
                    industry: bpText("Technology startup"),
                    format: "investor"
                },
                sections: {
                    company: {
                        name: bpText("New Technology Startup"),
                        concept: bpText("A software platform that helps African SMEs digitize operations, payments, and customer workflows.")
                    },
                    market: {
                        targetCustomers: bpText("Small businesses, service providers, and growing teams that need affordable business software built around local payment and compliance realities."),
                        competitors: bpText("Global SaaS tools, spreadsheets, WhatsApp-based operations, and local point solutions."),
                        advantage: bpText("Africa-first workflows, mobile-first onboarding, local payment support, and lower total cost.")
                    },
                    products: {
                        offer: bpText("Subscription software, setup support, integrations, analytics, and premium advisory services."),
                        pricing: bpText("Monthly subscription tiers with setup fees for larger clients and optional managed support.")
                    },
                    marketing: {
                        channels: bpText("Founder-led sales, partner accountants, LinkedIn, SME associations, webinars, SEO, referrals, and pilot programs.")
                    }
                },
                financials: {
                    revenue: [ 36e6, 108e6, 24e7 ],
                    cogs: [ 54e5, 162e5, 36e6 ],
                    opex: [ 18e6, 42e6, 84e6 ],
                    salaries: [ 24e6, 54e6, 108e6 ],
                    marketing: [ 6e6, 18e6, 36e6 ]
                }
            }
        },
        retail: {
            label: bpText("Retail"),
            sector: bpText("Retail and commerce"),
            data: {
                meta: {
                    industry: bpText("Retail and e-commerce"),
                    format: "lender"
                },
                sections: {
                    company: {
                        name: bpText("New Retail Business"),
                        concept: bpText("A retail business combining a physical outlet, social commerce, and reliable delivery for fast-moving consumer products.")
                    },
                    market: {
                        targetCustomers: bpText("Urban households, young professionals, students, and small offices seeking convenience and fair pricing."),
                        competitors: bpText("Open-market traders, supermarkets, social sellers, and delivery platforms."),
                        advantage: bpText("Curated stock, transparent pricing, quick fulfillment, and customer retention through WhatsApp and loyalty offers.")
                    },
                    products: {
                        offer: bpText("Consumer goods, curated bundles, seasonal offers, and delivery service."),
                        pricing: bpText("Markup-based pricing with stock rotation controls and supplier-negotiated discounts.")
                    }
                },
                financials: {
                    revenue: [ 6e7, 9e7, 125e6 ],
                    cogs: [ 42e6, 612e5, 8375e4 ],
                    opex: [ 72e5, 99e5, 1375e4 ],
                    salaries: [ 6e6, 84e5, 12e6 ],
                    marketing: [ 18e5, 27e5, 375e4 ]
                }
            }
        },
        agriculture: {
            label: bpText("Agriculture"),
            sector: bpText("Agriculture"),
            data: {
                meta: {
                    industry: bpText("Agriculture and processing"),
                    format: "grant"
                },
                sections: {
                    company: {
                        name: bpText("New Agribusiness Venture"),
                        concept: bpText("An agribusiness that improves production, aggregation, processing, or distribution for local and regional markets.")
                    },
                    market: {
                        targetCustomers: bpText("Food processors, wholesalers, retailers, restaurants, households, and institutional buyers."),
                        competitors: bpText("Smallholder producers, middlemen, imported substitutes, and informal processors."),
                        advantage: bpText("Reliable supply, better quality control, storage discipline, and stronger market access.")
                    },
                    operations: {
                        suppliers: bpText("Smallholder farmers, input suppliers, storage providers, transporters, extension agents, and packaging vendors."),
                        licenses: bpText("Business registration, food safety approvals where relevant, local permits, tax registration, and export documentation if applicable.")
                    },
                    milestones: {
                        nextSteps: bpText("Secure land or aggregation contracts, validate buyer demand, finalize input supply, complete pilot cycle, and lock distribution partners.")
                    }
                },
                financials: {
                    revenue: [ 3e7, 54e6, 84e6 ],
                    cogs: [ 165e5, 2916e4, 4452e4 ],
                    opex: [ 54e5, 81e5, 1176e4 ],
                    salaries: [ 42e5, 66e5, 96e5 ],
                    marketing: [ 9e5, 162e4, 252e4 ]
                }
            }
        },
        manufacturing: {
            label: bpText("Manufacturing"),
            sector: bpText("Manufacturing"),
            data: {
                meta: {
                    industry: bpText("Light manufacturing"),
                    format: "lender"
                },
                sections: {
                    company: {
                        name: bpText("New Manufacturing Venture"),
                        concept: bpText("A local manufacturing business producing quality goods for domestic and regional buyers.")
                    },
                    products: {
                        offer: bpText("Locally manufactured products, bulk supply, private-label production, and after-sales support."),
                        pricing: bpText("Cost-plus pricing with volume discounts and long-term supply contracts.")
                    },
                    operations: {
                        suppliers: bpText("Raw material suppliers, packaging providers, equipment maintenance partners, logistics providers, and utilities."),
                        staffing: bpText("Production lead, machine operators, quality inspector, warehouse assistant, sales lead, and finance/admin support.")
                    },
                    risks: {
                        risks: bpText("Power instability, raw material price volatility, equipment downtime, quality drift, and working-capital pressure."),
                        mitigations: bpText("Backup power planning, supplier diversification, preventive maintenance, QC checklists, and phased inventory purchases.")
                    }
                },
                financials: {
                    revenue: [ 75e6, 125e6, 18e7 ],
                    cogs: [ 4125e4, 675e5, 954e5 ],
                    opex: [ 1125e4, 175e5, 252e5 ],
                    salaries: [ 15e6, 24e6, 36e6 ],
                    marketing: [ 225e4, 375e4, 54e5 ],
                    capex: [ 25e6, 1e7, 15e6 ]
                }
            }
        },
        logistics: {
            label: bpText("Logistics"),
            sector: bpText("Logistics"),
            data: {
                meta: {
                    industry: bpText("Logistics and delivery"),
                    format: "lender"
                },
                sections: {
                    company: {
                        name: bpText("New Logistics Business"),
                        concept: bpText("A logistics company providing dependable delivery, warehousing, and route support for SMEs and e-commerce sellers.")
                    },
                    market: {
                        targetCustomers: bpText("Online sellers, wholesalers, manufacturers, pharmacies, food businesses, and SMEs needing reliable deliveries."),
                        competitors: bpText("Courier companies, informal dispatch riders, marketplace logistics, and in-house fleets."),
                        advantage: bpText("Route discipline, proof-of-delivery controls, transparent pricing, and service-level reporting.")
                    },
                    operations: {
                        suppliers: bpText("Rider partners, fleet maintenance providers, fuel partners, warehouse operators, insurance providers, and technology vendors.")
                    }
                },
                financials: {
                    revenue: [ 42e6, 78e6, 132e6 ],
                    cogs: [ 126e5, 234e5, 396e5 ],
                    opex: [ 96e5, 1716e4, 2904e4 ],
                    salaries: [ 12e6, 216e5, 36e6 ],
                    marketing: [ 21e5, 39e5, 66e5 ],
                    capex: [ 12e6, 18e6, 24e6 ]
                }
            }
        },
        healthcare: {
            label: bpText("Healthcare"),
            sector: bpText("Healthcare"),
            data: {
                meta: {
                    industry: bpText("Healthcare services"),
                    format: "grant"
                },
                sections: {
                    company: {
                        name: bpText("New Healthcare Venture"),
                        concept: bpText("A healthcare service improving access, affordability, and continuity of care for underserved communities.")
                    },
                    market: {
                        targetCustomers: bpText("Patients, clinics, pharmacies, employers, insurers, and community health partners."),
                        competitors: bpText("Clinics, pharmacies, informal providers, digital health apps, and hospital networks."),
                        advantage: bpText("Trust, clinical partnerships, compliance discipline, patient follow-up, and transparent pricing.")
                    },
                    operations: {
                        licenses: bpText("Business registration, clinical approvals where applicable, data privacy compliance, pharmacy or lab permits if required, and insurance coverage.")
                    }
                },
                financials: {
                    revenue: [ 36e6, 66e6, 108e6 ],
                    cogs: [ 108e5, 198e5, 324e5 ],
                    opex: [ 108e5, 198e5, 324e5 ],
                    salaries: [ 144e5, 24e6, 384e5 ],
                    marketing: [ 18e5, 33e5, 54e5 ]
                }
            }
        },
        education: {
            label: bpText("Education"),
            sector: bpText("Education"),
            data: {
                meta: {
                    industry: bpText("Education and training"),
                    format: "grant"
                },
                sections: {
                    company: {
                        name: bpText("New Education Venture"),
                        concept: bpText("An education business delivering practical learning, tutoring, or skills development for learners and working adults.")
                    },
                    market: {
                        targetCustomers: bpText("Students, parents, schools, professionals, SMEs, and corporate training teams."),
                        competitors: bpText("Schools, tutoring centers, online course platforms, informal tutors, and training providers."),
                        advantage: bpText("Outcome-focused curriculum, local relevance, hybrid delivery, and measurable learner progress.")
                    },
                    products: {
                        offer: bpText("Courses, tutoring packages, certification programs, learning materials, and employer training.")
                    }
                },
                financials: {
                    revenue: [ 24e6, 48e6, 84e6 ],
                    cogs: [ 48e5, 96e5, 168e5 ],
                    opex: [ 72e5, 144e5, 252e5 ],
                    salaries: [ 84e5, 168e5, 294e5 ],
                    marketing: [ 12e5, 24e5, 42e5 ]
                }
            }
        },
        fintech: {
            label: bpText("Fintech"),
            sector: bpText("Financial technology"),
            data: {
                meta: {
                    industry: bpText("Fintech"),
                    format: "investor"
                },
                sections: {
                    company: {
                        name: bpText("New Fintech Venture"),
                        concept: bpText("A fintech product expanding access to payments, credit, savings, or financial operations for African users and businesses.")
                    },
                    market: {
                        targetCustomers: bpText("SMEs, agents, gig workers, underbanked consumers, diaspora families, and digital merchants."),
                        competitors: bpText("Banks, mobile money operators, payment processors, lending apps, and informal finance groups."),
                        advantage: bpText("Lower friction, trust, local compliance, agent distribution, and better user education.")
                    },
                    operations: {
                        licenses: bpText("Company registration, data protection, payment or lending approvals where applicable, AML/KYC controls, and partner bank agreements.")
                    },
                    risks: {
                        risks: bpText("Regulatory changes, fraud, liquidity pressure, trust barriers, API downtime, and customer support complexity."),
                        mitigations: bpText("Compliance counsel, transaction monitoring, staged rollout, capital buffers, redundancy, and clear escalation playbooks.")
                    }
                },
                financials: {
                    revenue: [ 48e6, 144e6, 36e7 ],
                    cogs: [ 96e5, 288e5, 72e6 ],
                    opex: [ 24e6, 72e6, 144e6 ],
                    salaries: [ 36e6, 9e7, 18e7 ],
                    marketing: [ 12e6, 36e6, 9e7 ],
                    capex: [ 12e6, 24e6, 36e6 ]
                }
            }
        },
        realestate: {
            label: bpText("Real estate"),
            sector: bpText("Real estate"),
            data: {
                meta: {
                    industry: bpText("Real estate and property"),
                    format: "lender"
                },
                sections: {
                    company: {
                        name: bpText("New Real Estate Venture"),
                        concept: bpText("A real estate business developing, managing, or brokering property assets for growing urban markets.")
                    },
                    market: {
                        targetCustomers: bpText("Young professionals, growing families, SMEs, diaspora buyers, and institutional tenants."),
                        competitors: bpText("Property developers, brokers, informal agents, short-let operators, and housing cooperatives."),
                        advantage: bpText("Transparent documentation, location discipline, reliable delivery, property management quality, and buyer trust.")
                    },
                    funding: {
                        useOfFunds: bpText("Land acquisition, approvals, professional fees, construction, marketing, working capital, and contingency.")
                    }
                },
                financials: {
                    revenue: [ 9e7, 18e7, 3e8 ],
                    cogs: [ 54e6, 108e6, 18e7 ],
                    opex: [ 9e6, 18e6, 3e7 ],
                    salaries: [ 12e6, 24e6, 36e6 ],
                    marketing: [ 45e5, 9e6, 15e6 ],
                    capex: [ 5e7, 8e7, 12e7 ]
                }
            }
        }
    }, l = [ {
        id: "company",
        label: bpText("Company"),
        help: bpText("Define the business clearly before writing the rest of the plan."),
        fields: [ [ "name", bpText("Business name"), "input", bpText("e.g. Kijiji Solar Services Ltd") ], [ "concept", bpText("Business concept"), "textarea", bpText("What does the business do, for whom, and why now?") ], [ "mission", bpText("Mission"), "textarea", bpText("What change does the business exist to make?") ], [ "legalStructure", bpText("Legal structure"), "input", bpText("Sole proprietorship, partnership, limited company, cooperative") ], [ "location", bpText("Location and coverage"), "input", bpText("City, country, and operating region") ], [ "team", bpText("Founder and team strengths"), "textarea", bpText("Relevant skills, experience, advisors, and execution capacity") ] ]
    }, {
        id: "market",
        label: bpText("Market"),
        help: bpText("Show that the opportunity is real and that you understand the buyer."),
        fields: [ [ "problem", bpText("Problem"), "textarea", bpText("What customer pain or market gap are you solving?") ], [ "targetCustomers", bpText("Target customers"), "textarea", bpText("Who buys, who uses, and who influences the purchase?") ], [ "marketSize", bpText("Market size and trend"), "textarea", bpText("Estimate market size, growth drivers, and local demand signals.") ], [ "competitors", bpText("Competitors"), "textarea", bpText("List direct and indirect competitors.") ], [ "advantage", bpText("Competitive advantage"), "textarea", bpText("Why will customers choose you instead?") ] ]
    }, {
        id: "products",
        label: bpText("Offer"),
        help: bpText("Explain exactly what you sell and how money comes in."),
        fields: [ [ "offer", bpText("Products or services"), "textarea", bpText("Describe the offer in plain language.") ], [ "pricing", bpText("Pricing and margins"), "textarea", bpText("How do you price? What margin logic do you use?") ], [ "salesModel", bpText("Sales model"), "textarea", bpText("Retail, subscription, contracts, agents, B2B, wholesale, marketplace, or other.") ], [ "customerProof", bpText("Customer proof"), "textarea", bpText("Pilots, waiting list, sales conversations, LOIs, repeat purchases, testimonials, or research.") ] ]
    }, {
        id: "marketing",
        label: bpText("Marketing"),
        help: bpText("A good plan explains how customers will hear, trust, buy, and return."),
        fields: [ [ "positioning", bpText("Positioning"), "textarea", bpText("How should the market describe your business?") ], [ "channels", bpText("Acquisition channels"), "textarea", bpText("Referrals, social media, SEO, agents, partnerships, events, sales reps, or distributors.") ], [ "budget", bpText("Marketing budget"), "input", bpText("Monthly or annual spend") ], [ "retention", bpText("Retention plan"), "textarea", bpText("How will you keep customers coming back?") ] ]
    }, {
        id: "operations",
        label: bpText("Operations"),
        help: bpText("Lenders and partners look for operational discipline, not only ambition."),
        fields: [ [ "process", bpText("Operating process"), "textarea", bpText("How is the product or service delivered from order to completion?") ], [ "suppliers", bpText("Suppliers and partners"), "textarea", bpText("Key suppliers, service providers, platforms, distributors, and dependencies.") ], [ "staffing", bpText("Staffing plan"), "textarea", bpText("Roles required now and roles needed as the business grows.") ], [ "licenses", bpText("Licenses, compliance, and records"), "textarea", bpText("Registrations, permits, tax records, insurance, data privacy, sector approvals.") ] ]
    }, {
        id: "milestones",
        label: bpText("Milestones"),
        help: bpText("Convert the plan into a 12-month execution map."),
        fields: [ [ "nextSteps", bpText("Next 90 days"), "textarea", bpText("Immediate actions required to launch or improve traction.") ], [ "yearOne", bpText("Year 1 milestones"), "textarea", bpText("Revenue, customer, hiring, product, operating, and compliance milestones.") ], [ "kpis", bpText("KPIs to track"), "textarea", bpText("Revenue, gross margin, cash runway, repeat purchase, CAC, stock turn, utilization, churn, or other metrics.") ] ]
    }, {
        id: "financials",
        label: bpText("Financials"),
        help: bpText("Build a simple 3 to 5 year model. Keep assumptions visible and believable."),
        financial: !0
    }, {
        id: "funding",
        label: bpText("Funding"),
        help: bpText("Explain how much capital is needed, where it goes, and how it will be repaid or returned."),
        fields: [ [ "amountNeeded", bpText("Funding required"), "input", bpText("Total capital needed") ], [ "useOfFunds", bpText("Use of funds"), "textarea", bpText("Break down setup costs, equipment, inventory, hiring, marketing, working capital, and contingency.") ], [ "sources", bpText("Funding sources"), "textarea", bpText("Owner equity, bank loan, angel investment, grant, supplier credit, revenue, or partners.") ], [ "repayment", bpText("Repayment or investor return plan"), "textarea", bpText("How will lenders be repaid or investors get a return?") ] ]
    }, {
        id: "risks",
        label: bpText("Risks"),
        help: bpText("Strong plans admit risks and show practical mitigation."),
        fields: [ [ "risks", bpText("Top risks"), "textarea", bpText("Market, operations, finance, compliance, supplier, technology, hiring, or security risks.") ], [ "mitigations", bpText("Mitigation plan"), "textarea", bpText("Controls, backups, insurance, phased rollout, cash buffers, compliance checks, and monitoring.") ], [ "assumptions", bpText("Key assumptions to validate"), "textarea", bpText("What must prove true for the plan to work?") ] ]
    } ];
    function u(e) {
        return document.getElementById(e);
    }
    function d(e, t) {
        return t && "object" == typeof t ? (Object.keys(t).forEach(function(n) {
            Array.isArray(t[n]) ? e[n] = t[n].slice() : t[n] && "object" == typeof t[n] && e[n] && "object" == typeof e[n] ? d(e[n], t[n]) : void 0 !== t[n] && (e[n] = t[n]);
        }), e) : e;
    }
    function p(e) {
        var t = d({
            meta: {
                format: "lender",
                country: "Nigeria",
                currency: "NGN",
                forecastYears: 3,
                industry: "",
                template: "blank"
            },
            sections: {
                company: {},
                market: {},
                products: {},
                marketing: {},
                operations: {},
                milestones: {},
                funding: {},
                risks: {}
            },
            financials: {
                revenue: [ 0, 0, 0, 0, 0 ],
                cogs: [ 0, 0, 0, 0, 0 ],
                opex: [ 0, 0, 0, 0, 0 ],
                salaries: [ 0, 0, 0, 0, 0 ],
                marketing: [ 0, 0, 0, 0, 0 ],
                capex: [ 0, 0, 0, 0, 0 ],
                startupCosts: 0,
                ownerEquity: 0,
                assumptions: bpText("List the logic behind your prices, volumes, costs, hiring, and growth.")
            }
        }, function(e) {
            if (e.meta || e.sections || e.financials) return e;
            var t = {
                meta: {
                    format: "lender",
                    country: "Nigeria",
                    currency: "NGN",
                    forecastYears: 3,
                    industry: "",
                    template: "blank"
                },
                sections: {
                    company: {},
                    market: {},
                    products: {},
                    marketing: {},
                    operations: {},
                    milestones: {},
                    funding: {},
                    risks: {}
                },
                financials: {
                    revenue: [ 0, 0, 0, 0, 0 ],
                    cogs: [ 0, 0, 0, 0, 0 ],
                    opex: [ 0, 0, 0, 0, 0 ],
                    salaries: [ 0, 0, 0, 0, 0 ],
                    marketing: [ 0, 0, 0, 0, 0 ],
                    capex: [ 0, 0, 0, 0, 0 ],
                    startupCosts: 0,
                    ownerEquity: 0,
                    assumptions: bpText("List the logic behind your prices, volumes, costs, hiring, and growth.")
                }
            };
            return t.sections.company.name = e.legalName || e.businessName || "", t.sections.company.legalStructure = e.legalStructure || "",
            t.sections.company.location = e.location || "", t.sections.company.team = e.team || "",
            t.sections.company.mission = e.mission || "", t.sections.company.concept = e.overview || e.vision || "",
            t.sections.market.targetCustomers = e.targetMarket || "", t.sections.market.marketSize = e.marketSize || "",
            t.sections.market.competitors = e.competitors || "", t.sections.market.advantage = e.swot || "",
            t.sections.products.offer = e.offerings || "", t.sections.products.pricing = e.pricing || "",
            t.sections.products.customerProof = e.competitive || "", t.sections.marketing.channels = e.channels || "",
            t.sections.marketing.budget = e.budget || "", t.sections.marketing.positioning = e.gtm || "",
            t.sections.funding.amountNeeded = e.fundingNeeded || "", t.sections.funding.useOfFunds = e.fundingUse || "",
            t.sections.funding.sources = e.fundingSources || "", [ "revenue", "cogs", "opex", "marketing_cost", "salaries" ].forEach(function(n) {
                for (var a = "marketing_cost" === n ? "marketing" : n, i = 1; i <= 3; i += 1) t.financials[a][i - 1] = m(e["fin_" + n + "_y" + i]);
            }), t;
        }(e || {}));
        return t.meta.forecastYears = Math.min(5, Math.max(3, Number(t.meta.forecastYears) || 3)),
        s[t.meta.currency] || (t.meta.currency = o[t.meta.country] || "NGN"), Object.keys(t.financials).forEach(function(e) {
            if (Array.isArray(t.financials[e])) {
                for (;t.financials[e].length < 5; ) t.financials[e].push(0);
                t.financials[e] = t.financials[e].slice(0, 5).map(m);
            }
        }), t.financials.startupCosts = m(t.financials.startupCosts), t.financials.ownerEquity = m(t.financials.ownerEquity),
        t;
    }
    function m(e) {
        var t = Number(String(null == e ? "" : e).replace(/,/g, ""));
        return Number.isFinite(t) ? t : 0;
    }
    function g(e) {
        return String(null == e ? "" : e).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    }
    function f(e) {
        return g(e).replace(/`/g, "&#96;");
    }
    function h(t) {
        var n = s[e.meta.currency] || e.meta.currency, a = m(t);
        return (a < 0 ? "-" : "") + n + " " + Math.abs(a).toLocaleString(bpLocale ? "ha-NG" : "en-US", {
            maximumFractionDigits: 0
        });
    }
    function v(t) {
        return e.meta.currency + " " + m(t).toLocaleString(bpLocale ? "ha-NG" : "en-US", {
            maximumFractionDigits: 0
        });
    }
    function b() {
        var t = Number(e.meta.forecastYears) || 3;
        return Array.from({
            length: t
        }, function(e, t) {
            return t + 1;
        });
    }
    function y() {
        var t = [];
        return b().forEach(function(n) {
            var a = n - 1, i = m(e.financials.revenue[a]), r = m(e.financials.cogs[a]), s = m(e.financials.opex[a]), o = m(e.financials.salaries[a]), c = m(e.financials.marketing[a]), l = m(e.financials.capex[a]), u = i - r, d = u - s - o - c, p = d - l, g = i ? u / i * 100 : 0;
            t.push({
                year: n,
                revenue: i,
                cogs: r,
                grossProfit: u,
                grossMargin: g,
                opex: s,
                salaries: o,
                marketing: c,
                capex: l,
                ebitda: d,
                netCash: p
            });
        }), t;
    }
    function k() {
        var t, n = Math.max(0, -y()[0].netCash), a = (t = e.sections.funding.amountNeeded,
        m(String(t || "").replace(/[^\d.-]/g, ""))), i = m(e.financials.startupCosts), r = m(e.financials.ownerEquity);
        return Math.max(0, i + n - r - a);
    }
    function w() {
        u("sectionNav").innerHTML = l.map(function(t, n) {
            var i = "bp-section-tab" + (n === a ? " active" : "") + (function(t) {
                if (t.financial) {
                    var n = [ "revenue", "cogs", "opex" ], a = 0, i = 3 * n.length + 1;
                    return n.forEach(function(t) {
                        for (var n = 0; n < 3; n += 1) m(e.financials[t][n]) > 0 && (a += 1);
                    }), e.financials.assumptions && e.financials.assumptions.length > 20 && (a += 1),
                    a / i;
                }
                var r = t.fields || [];
                if (!r.length) return 0;
                var s = r.filter(function(n) {
                    return x(e.sections[t.id][n[0]]).length >= 12;
                }).length;
                return s / r.length;
            }(t) >= .7 ? " done" : "");
            return '<button class="' + i + '" type="button" data-section-index="' + n + '">' + g(t.label) + "</button>";
        }).join("");
    }
    function x(e) {
        return String(e || "").trim();
    }
    function S() {
        var e = y();
        document.querySelectorAll("[data-fin-calc]").forEach(function(t) {
            var n = t.getAttribute("data-fin-calc"), a = Number(t.getAttribute("data-fin-year")) || 0, i = e[a] ? e[a][n] : 0;
            t.textContent = h(i), t.classList.toggle("negative", i < 0);
        });
    }
    function C() {
        u("planTitle").textContent = E(), u("planPreview").innerHTML = L(!1);
    }
    function E() {
        return e.sections.company.name || e.meta.industry || bpText("Untitled business plan");
    }
    function L(t) {
        if (t) return A();
        var n = "<h1>" + g(E()) + "</h1>";
        return n += bpText("<p><strong>Plan type:</strong> ") + g(F(e.meta.format)) + bpText(" | <strong>Country:</strong> ") + g(bpLocale ? bpLocale.country(e.meta.country) : e.meta.country) + bpText(" | <strong>Currency:</strong> ") + g(e.meta.currency) + "</p>",
        l.forEach(function(t) {
            n += "<h2>" + g(t.label) + "</h2>", t.financial ? n += N() : (t.fields || []).forEach(function(a) {
                var i = e.sections[t.id][a[0]];
                x(i) && (n += "<p><strong>" + g(a[1]) + ":</strong><br>" + g(i) + "</p>");
            });
        }), n;
    }
    function A() {
        var t = e.sections.company, n = e.sections.market, a = e.sections.products, i = e.sections.funding, r = e.sections.risks;
        return "<h1>" + g(E()) + bpText("</h1><h2>Business snapshot</h2><p>") + g(t.concept || t.mission || bpText("Describe the business concept.")) + bpText("</p><h2>Customer and market</h2><p>") + g(n.targetCustomers || bpText("Define the target customer.")) + bpText("</p><h2>Offer</h2><p>") + g(a.offer || bpText("Describe products or services.")) + bpText("</p><h2>Advantage</h2><p>") + g(n.advantage || a.customerProof || bpText("Explain why this business can win.")) + bpText("</p><h2>Financial snapshot</h2>") + N(!0) + bpText("<h2>Funding and risk</h2><p><strong>Funding:</strong> ") + g(i.amountNeeded || bpText("Not specified")) + bpText("</p><p><strong>Risk controls:</strong> ") + g(r.mitigations || bpText("Add risk mitigations.")) + "</p>";
    }
    function N(t) {
        var n = y(), a = t ? [ [ "revenue", bpText("Revenue") ], [ "grossProfit", bpText("Gross profit") ], [ "ebitda", bpText("Operating profit") ], [ "netCash", bpText("Net cash") ] ] : [ [ "revenue", bpText("Revenue") ], [ "cogs", bpText("Direct costs") ], [ "grossProfit", bpText("Gross profit") ], [ "opex", bpText("Operating expenses") ], [ "salaries", bpText("Salaries") ], [ "marketing", bpText("Marketing") ], [ "capex", bpText("Capex") ], [ "ebitda", bpText("Operating profit") ], [ "netCash", bpText("Net cash") ] ], i = bpText("<table><thead><tr><th>Line item</th>");
        return n.forEach(function(e) {
            i += bpText("<th>Year ") + e.year + "</th>";
        }), i += "</tr></thead><tbody>", a.forEach(function(t) {
            i += "<tr><td>" + g(t[1]) + "</td>", n.forEach(function(n) {
                var a = t[0] in n ? n[t[0]] : m(e.financials[t[0]][n.year - 1]);
                i += "<td>" + g(v(a)) + "</td>";
            }), i += "</tr>";
        }), i += "</tbody></table>", !t && e.financials.assumptions && (i += bpText("<p><strong>Assumptions:</strong><br>") + g(e.financials.assumptions) + "</p>"),
        i;
    }
    function F(e) {
        return {
            lender: bpText("Lender-ready plan"),
            investor: bpText("Investor plan"),
            lean: bpText("Lean one-page plan"),
            grant: bpText("Grant or NGO plan"),
            internal: bpText("Internal growth plan")
        }[e] || bpText("Business plan");
    }
    function M() {
        var t = y(), n = [ {
            label: bpText("Business concept is clear"),
            ok: x(e.sections.company.concept).length >= 40,
            points: 10
        }, {
            label: bpText("Target customer is specific"),
            ok: x(e.sections.market.targetCustomers).length >= 35,
            points: 10
        }, {
            label: bpText("Competitors and advantage included"),
            ok: x(e.sections.market.competitors).length >= 20 && x(e.sections.market.advantage).length >= 25,
            points: 12
        }, {
            label: bpText("Offer and pricing are explained"),
            ok: x(e.sections.products.offer).length >= 25 && x(e.sections.products.pricing).length >= 20,
            points: 10
        }, {
            label: bpText("Marketing channels and retention covered"),
            ok: x(e.sections.marketing.channels).length >= 25 && x(e.sections.marketing.retention).length >= 20,
            points: 9
        }, {
            label: bpText("Operations, staffing, and compliance addressed"),
            ok: x(e.sections.operations.process).length >= 25 && x(e.sections.operations.staffing).length >= 20 && x(e.sections.operations.licenses).length >= 20,
            points: 12
        }, {
            label: bpText("Milestones and KPIs included"),
            ok: x(e.sections.milestones.nextSteps).length >= 20 && x(e.sections.milestones.kpis).length >= 20,
            points: 8
        }, {
            label: bpText("Financial forecast has revenue and costs"),
            ok: t[0].revenue > 0 && t[0].cogs >= 0 && t[0].opex >= 0 && t[0].revenue >= t[0].cogs,
            points: 12
        }, {
            label: bpText("Funding use and repayment logic included"),
            ok: x(e.sections.funding.amountNeeded).length > 0 && x(e.sections.funding.useOfFunds).length >= 25 && x(e.sections.funding.repayment).length >= 20,
            points: 10
        }, {
            label: bpText("Risks and mitigations are realistic"),
            ok: x(e.sections.risks.risks).length >= 25 && x(e.sections.risks.mitigations).length >= 25,
            points: 7
        } ], a = n.reduce(function(e, t) {
            return e + (t.ok ? t.points : 0);
        }, 0);
        u("scoreValue").textContent = String(a), u("scoreMeter").style.width = a + "%",
        u("scoreLabel").textContent = a >= 90 ? bpText("Ready") : a >= 70 ? bpText("Review") : bpText("Draft"),
        u("checkList").innerHTML = n.map(function(e) {
            return '<div class="bp-check ' + (e.ok ? "ok" : "") + '"><span class="bp-check-dot">' + (e.ok ? bpText("OK") : "!") + "</span><span><strong>" + g(e.label) + "</strong></span></div>";
        }).join("");
    }
    function O() {
        var e = y()[0];
        u("metricRevenue").textContent = h(e.revenue), u("metricProfit").textContent = h(e.ebitda),
        u("metricMargin").textContent = (e.grossMargin || 0).toFixed(1) + "%", u("metricFunding").textContent = h(k());
    }
    function R() {
        if (n) {
            var e;
            try { e = n.getAll(); clearSavedFailure(); } catch (error) { savedFailure(error); return; }
            u("savedPanel").hidden = !e.length, u("savedPlans").innerHTML = e.map(function(e) {
                return '<article class="bp-saved-card"><div class="bp-saved-title">' + g(e.title || bpText("Business plan")) + '</div><div class="bp-saved-date">' + g(function(e) {
                    try {
                        return new Date(e).toLocaleString(bpLocale ? "ha-NG" : "en-GB", {
                            day: "2-digit",
                            month: bpLocale ? "2-digit" : "short",
                            hour: "2-digit",
                            minute: "2-digit"
                        });
                    } catch (e) {
                        return bpText("Saved");
                    }
                }(e.updatedAt)) + '</div><div class="bp-saved-actions"><button type="button" data-open-saved="' + f(e.id) + bpText('">Open</button><button type="button" data-delete-saved="') + f(e.id) + bpText('">Delete</button></div></article>');
            }).join("");
        }
    }
    function T() {
        u("templateRow").innerHTML = Object.keys(c).map(function(t) {
            return '<button class="bp-template-btn' + (e.meta.template === t ? " active" : "") + '" type="button" data-template="' + f(t) + '">' + g(c[t].label) + "</button>";
        }).join(""), w(), document.querySelectorAll("[data-bind]").forEach(function(t) {
            var n = t.getAttribute("data-bind").split(".").reduce(function(e, t) {
                return e && e[t];
            }, e);
            t.value = null == n ? "" : n;
        }), function() {
            var t, n, i, r = l[a];
            u("sectionKicker").textContent = bpText("Section ") + (a + 1) + bpText(" of ") + l.length, u("sectionTitle").textContent = r.label,
            u("sectionHelp").textContent = r.help, u("prevSectionBtn").disabled = 0 === a, u("nextSectionBtn").textContent = a === l.length - 1 ? bpText("Export PDF") : bpText("Next"),
            r.financial ? u("sectionBody").innerHTML = (t = [ [ "revenue", bpText("Revenue") ], [ "cogs", bpText("Cost of goods or direct costs") ], [ "grossProfit", bpText("Gross profit"), !0 ], [ "opex", bpText("Operating expenses") ], [ "salaries", bpText("Salaries and wages") ], [ "marketing", bpText("Marketing and sales") ], [ "capex", bpText("Capital expenditure") ], [ "ebitda", bpText("Operating profit"), !0 ], [ "netCash", bpText("Net cash after capex"), !0 ] ],
            n = y(), i = '<div class="bp-grid three"><label>Startup costs<input data-fin-single="startupCosts" type="number" min="0" step="1" value="' + f(e.financials.startupCosts) + '"></label><label>Owner equity<input data-fin-single="ownerEquity" type="number" min="0" step="1" value="' + f(e.financials.ownerEquity) + '"></label><label>Financial assumptions<input data-fin-single="assumptions" type="text" value="' + f(e.financials.assumptions) + bpText('"></label></div><div class="bp-fin-wrap"><table class="bp-fin-table"><thead><tr><th>Line item</th>'),
            b().forEach(function(e) {
                i += bpText("<th>Year ") + e + "</th>";
            }), i += "</tr></thead><tbody>", t.forEach(function(t) {
                i += "<tr><td>" + g(t[1]) + "</td>", b().forEach(function(a, r) {
                    if (t[2]) {
                        var s = n[r][t[0]];
                        i += '<td class="bp-fin-calc ' + (s < 0 ? "negative" : "") + '" data-fin-calc="' + f(t[0]) + '" data-fin-year="' + r + '">' + h(s) + "</td>";
                    } else i += '<td><input data-fin-row="' + f(t[0]) + '" data-fin-year="' + r + '" type="number" step="1" value="' + f(e.financials[t[0]][r]) + '"></td>';
                }), i += "</tr>";
            }), i += "</tbody></table></div>") : u("sectionBody").innerHTML = '<div class="bp-grid two">' + r.fields.map(function(t) {
                var n = r.id + "." + t[0], a = e.sections[r.id][t[0]] || "", i = "textarea" === t[2] ? '<textarea data-section-field="' + f(n) + '" placeholder="' + f(t[3] || "") + '">' + g(a) + "</textarea>" : '<input data-section-field="' + f(n) + '" type="text" value="' + f(a) + '" placeholder="' + f(t[3] || "") + '">';
                return "<label>" + g(t[1]) + i + (t[3] ? '<span class="bp-field-note">' + g(t[3]) + "</span>" : "") + "</label>";
            }).join("") + "</div>";
        }(), C(), M(), O(), P();
    }
    function P() {
        r && clearTimeout(r), r = setTimeout(function() {
            try {
                localStorage.setItem(t, JSON.stringify(e)), u("draftStatus").textContent = bpText("Saved locally");
            } catch (e) {
                u("draftStatus").textContent = bpText("Draft only");
            }
        }, 250);
    }
    function B() {
        if (n) {
            try {
            var t = n.save({
                id: i,
                title: E(),
                data: JSON.parse(JSON.stringify(e))
            });
            i = t.id, R(), V(bpText("Plan saved in this browser."));
            } catch (error) { savedFailure(error); }
        } else V(bpText("Saved plans are unavailable in this browser."));
    }
    async function q() {
        if (window.jspdf && window.jspdf.jsPDF) {
            var t = new window.jspdf.jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4"
            });
            if (bpLocale) { try { var bpExportStamp = JSON.stringify(e); await bpLocale.preparePdf(t); if (JSON.stringify(e) !== bpExportStamp || !document.getElementById("bpExportReview").checked) { V("Tsarin ya canza. Sake dubawa kafin fitar da PDF."); return; } } catch (_) { V("An kasa loda rubutun PDF. Gwada fitar da TXT ko DOC."); return; } }
            var n = t.internal.pageSize.getWidth(), a = t.internal.pageSize.getHeight(), i = 18, r = 22, s = n - 36;
            t.setProperties({
                title: E(),
                subject: bpText("Business plan generated with AfroTools"),
                author: E(),
                creator: bpText("AfroTools Business Plan Builder")
            }), t.setFont(bpLocale ? "BusinessPlanNoto" : "helvetica", "bold"), t.setFontSize(18), r = D(t, E(), i, r, s, 8, a - 16) + 4,
            t.setFont(bpLocale ? "BusinessPlanNoto" : "helvetica", "normal"), t.setFontSize(10), r = D(t, F(e.meta.format) + " | " + (bpLocale ? bpLocale.country(e.meta.country) : e.meta.country) + " | " + e.meta.currency, i, r, s, 5.5, a - 16) + 3,
            l.forEach(function(n) {
                r > a - 34 && (t.addPage(), r = 22), t.setFont(bpLocale ? "BusinessPlanNoto" : "helvetica", "bold"), t.setFontSize(13),
                t.setTextColor(15, 74, 162), r = D(t, n.label, i, r, s, 7, a - 16) + 1, t.setTextColor(0, 0, 0),
                t.setFont(bpLocale ? "BusinessPlanNoto" : "times", "normal"), t.setFontSize(10.5), n.financial ? (j().forEach(function(e) {
                    r = D(t, e, i, r, s, 5.2, a - 16);
                }), r += 3) : (n.fields || []).forEach(function(o) {
                    var c = e.sections[n.id][o[0]];
                    x(c) && (bpLocale && r > a - 42 && (t.addPage(), r = 22), t.setFont(bpLocale ? "BusinessPlanNoto" : "helvetica", "bold"), r = D(t, o[1] + ":", i, r, s, 5.5, a - 16),
                    t.setFont(bpLocale ? "BusinessPlanNoto" : "times", "normal"), r = D(t, c, i, r, s, 5.5, a - 16) + 2);
                });
            });
            for (var o = 1; o <= t.getNumberOfPages(); o += 1) t.setPage(o), t.setFont(bpLocale ? "BusinessPlanNoto" : "helvetica", "normal"),
            t.setFontSize(8), t.setTextColor(140), t.text(bpText("Generated with AfroTools.com"), n / 2, a - 8, {
                align: "center"
            }), t.text(String(o), n - i, a - 8, {
                align: "right"
            }), t.setTextColor(0);
            t.save(J() + ".pdf"), V(bpText("PDF downloaded."));
        } else V(bpText("PDF tools are still loading."));
    }
    function D(e, t, n, a, i, r, s) {
        return e.splitTextToSize(String(t || ""), i).forEach(function(t) {
            a > s && (e.addPage(), a = 22), e.text(t, n, a), a += r;
        }), a;
    }
    function j() {
        var t = y(), n = [];
        return t.forEach(function(e) {
            n.push(bpText("Year ") + e.year + bpText(": revenue ") + v(e.revenue) + bpText(", gross profit ") + v(e.grossProfit) + bpText(", operating profit ") + v(e.ebitda) + bpText(", net cash ") + v(e.netCash) + bpText(", gross margin ") + e.grossMargin.toFixed(1) + "%.");
        }), e.financials.assumptions && n.push(bpText("Assumptions: ") + e.financials.assumptions),
        n;
    }
    function G() {
        W('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' + g(E()) + "</title></head><body>" + L(!1) + "</body></html>", J() + ".doc", "application/msword;charset=utf-8");
    }
    function H() {
        var t = [ E(), F(e.meta.format) + " | " + (bpLocale ? bpLocale.country(e.meta.country) : e.meta.country) + " | " + e.meta.currency, "" ];
        l.forEach(function(n) {
            t.push(n.label.toUpperCase()), n.financial ? t = t.concat(j()) : (n.fields || []).forEach(function(a) {
                var i = e.sections[n.id][a[0]];
                x(i) && t.push(a[1] + ": " + i);
            }), t.push("");
        }), W(t.join("\n").trim() + "\n", J() + ".txt", "text/plain;charset=utf-8");
    }
    function U() {
        var t = [ [ bpText("Line item") ].concat(b().map(function(e) {
            return bpText("Year ") + e;
        })) ], n = y();
        [ [ "revenue", bpText("Revenue") ], [ "cogs", bpText("Direct costs") ], [ "grossProfit", bpText("Gross profit") ], [ "opex", bpText("Operating expenses") ], [ "salaries", bpText("Salaries") ], [ "marketing", bpText("Marketing") ], [ "capex", bpText("Capex") ], [ "ebitda", bpText("Operating profit") ], [ "netCash", bpText("Net cash") ] ].forEach(function(a) {
            t.push([ a[1] ].concat(n.map(function(t) {
                return a[0] in t ? t[a[0]] : e.financials[a[0]][t.year - 1];
            })));
        }), t.push([], [ bpText("Startup costs"), e.financials.startupCosts ], [ bpText("Owner equity"), e.financials.ownerEquity ], [ bpText("Funding required"), e.sections.funding.amountNeeded || "" ]),
        W(t.map(K).join("\n"), J() + "-forecast.csv", "text/csv;charset=utf-8");
    }
    function z() {
        W(JSON.stringify({
            version: 2,
            exportedAt: (new Date).toISOString(),
            data: e
        }, null, 2), J() + ".json", "application/json;charset=utf-8");
    }
    function Y(t) {
        var n = t.target.files && t.target.files[0];
        if (n) {
            var r = new FileReader;
            r.onload = function() {
                try {
                    var n = JSON.parse(String(r.result || "{}"));
                    e = p(validateDocumentBackup(n)), i = null, a = 0, T(), V(bpText("Plan imported."));
                } catch (e) {
                    V(bpText("Could not import that JSON file."));
                } finally {
                    t.target.value = "";
                }
            }, r.readAsText(n);
        }
    }
    function I() {
        var e, t, n = (e = A(), (t = document.createElement("div")).innerHTML = e, t.innerText.replace(/\n{3,}/g, "\n\n").trim());
        navigator.clipboard ? navigator.clipboard.writeText(n).then(function() {
            V(bpText("One-page brief copied."));
        }).catch(function() {
            V(bpText("Copy failed. Use TXT export instead."));
        }) : V(bpText("Copy is unavailable. Use TXT export instead."));
    }
    function K(e) {
        return e.map(function(e) {
            var t = String(null == e ? "" : e);
            return /[",\n]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t;
        }).join(",");
    }
    function W(e, t, n) {
        var a = e instanceof Blob ? e : new Blob([ e ], {
            type: n || "application/octet-stream"
        }), i = document.createElement("a");
        i.href = URL.createObjectURL(a), i.download = t, document.body.appendChild(i), i.click(),
        i.remove(), setTimeout(function() {
            URL.revokeObjectURL(i.href);
        }, 500);
    }
    function J() {
        return E().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "business-plan";
    }
    function V(e) {
        var t = document.querySelector(".bp-toast");
        t || ((t = document.createElement("div")).className = "bp-toast", t.setAttribute("role", "status"),
        t.setAttribute("aria-live", "polite"), document.body.appendChild(t)), t.textContent = e,
        t.classList.add("show"), clearTimeout(V.timer), V.timer = setTimeout(function() {
            t.classList.remove("show");
        }, 2400);
    }
    function X() {
        e = function() {
            var e = new URLSearchParams(window.location.search);
            if (e.get("plan")) try {
                for (var a = e.get("plan").replace(/-/g, "+").replace(/_/g, "/"); a.length % 4; ) a += "=";
                var r = JSON.parse(decodeURIComponent(escape(atob(a))));
                return p(r.data || r);
            } catch (e) {
                V(bpText("The plan URL could not be opened."));
            }
            if (e.get("id") && n) {
                var s = readSavedItem(e.get("id"));
                if (s && s.data) return i = s.id, p(s.data);
            }
            try {
                var o = localStorage.getItem(t);
                if (o) return p(JSON.parse(o));
            } catch (e) {}
            return p({
                meta: {
                    format: "lender",
                    country: "Nigeria",
                    currency: "NGN",
                    forecastYears: 3,
                    industry: "",
                    template: "blank"
                },
                sections: {
                    company: {},
                    market: {},
                    products: {},
                    marketing: {},
                    operations: {},
                    milestones: {},
                    funding: {},
                    risks: {}
                },
                financials: {
                    revenue: [ 0, 0, 0, 0, 0 ],
                    cogs: [ 0, 0, 0, 0, 0 ],
                    opex: [ 0, 0, 0, 0, 0 ],
                    salaries: [ 0, 0, 0, 0, 0 ],
                    marketing: [ 0, 0, 0, 0, 0 ],
                    capex: [ 0, 0, 0, 0, 0 ],
                    startupCosts: 0,
                    ownerEquity: 0,
                    assumptions: bpText("List the logic behind your prices, volumes, costs, hiring, and growth.")
                }
            });
        }(), document.body.addEventListener("input", function(t) {
            var n = t.target.closest("[data-section-field]");
            if (n) {
                var a = n.getAttribute("data-section-field").split(".");
                return e.sections[a[0]][a[1]] = n.value, w(), C(), M(), void P();
            }
            var i = t.target.closest("[data-fin-row]");
            if (i) return e.financials[i.getAttribute("data-fin-row")][Number(i.getAttribute("data-fin-year"))] = m(i.value),
            S(), w(), C(), M(), O(), void P();
            var r = t.target.closest("[data-fin-single]");
            if (r) {
                var s = r.getAttribute("data-fin-single");
                e.financials[s] = "assumptions" === s ? r.value : m(r.value), S(), w(), C(), M(),
                O(), P();
            }
        }), document.body.addEventListener("change", function(t) {
            var n = t.target.closest("[data-bind]");
            if (n) {
                var a = n.getAttribute("data-bind");
                !function(t, n) {
                    for (var a = t.split("."), i = e, r = 0; r < a.length - 1; r += 1) i = i[a[r]];
                    i[a[a.length - 1]] = n;
                }(a, n.value), "meta.country" === a && (e.meta.currency = o[e.meta.country] || e.meta.currency),
                "meta.forecastYears" === a && (e.meta.forecastYears = Number(n.value) || 3), T();
            }
        }), u("templateRow").addEventListener("click", function(t) {
            var n, a, i = t.target.closest("[data-template]");
            i && (n = i.getAttribute("data-template"), (e = p(d(e, (a = c[n] || c.blank).data || {}))).meta.template = n,
            e.meta.industry = a.sector || e.meta.industry, T(), V(a.label + bpText(" template applied.")));
        }), u("sectionNav").addEventListener("click", function(e) {
            var t = e.target.closest("[data-section-index]");
            t && (a = Number(t.getAttribute("data-section-index")), T());
        }), u("prevSectionBtn").addEventListener("click", function() {
            a > 0 && (a -= 1, T());
        }), u("nextSectionBtn").addEventListener("click", function() {
            a < l.length - 1 ? (a += 1, T()) : q();
        }), u("savePlanBtn").addEventListener("click", B), u("savePlanSideBtn").addEventListener("click", B),
        u("pdfBtn").addEventListener("click", q), u("docBtn").addEventListener("click", G),
        u("txtBtn").addEventListener("click", H), u("csvBtn").addEventListener("click", U),
        u("jsonBtn").addEventListener("click", z), u("copyBriefBtn").addEventListener("click", I),
        u("onePageBtn").addEventListener("click", function() {
            u("planPreview").innerHTML = A(), V(bpText("One-page brief previewed."));
        }), u("importJson").addEventListener("change", Y), u("savedPlans").addEventListener("click", function(t) {
            var r = t.target.closest("[data-open-saved]"), s = t.target.closest("[data-delete-saved]");
            r && function(t) {
                var r = n && readSavedItem(t);
                r && r.data && (i = r.id, e = p(r.data), a = 0, T(), V(bpText("Plan loaded.")));
            }(r.getAttribute("data-open-saved")), s && function(e) {
                var t = n && readSavedItem(e);
                if (t === false) return;
                window.confirm(bpText('Delete "') + (t ? t.title : bpText("this plan")) + bpText('" from this browser?')) && deleteSavedItem(e) && (R(), focusSavedAction());
            }(s.getAttribute("data-delete-saved"));
        }), T(), R();
    }
    "loading" === document.readyState ? document.addEventListener("DOMContentLoaded", X) : X();
}();
