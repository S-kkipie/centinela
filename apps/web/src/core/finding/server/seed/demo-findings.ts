import type { FindingIngest } from "@centinela/contracts/finding";

/**
 * Demo findings for a fresh account, captured from a real Bogotá / Medellín /
 * Cundinamarca sweep (cross-referenced via Croma, scored by Gemini). Seeded on
 * signup so a first-time visitor — a hackathon judge — lands on a populated
 * console instead of an empty one, without spending Croma quota per signup. The
 * account also gets the live targets, so its heartbeat keeps producing more.
 *
 * Regenerate by sweeping a throwaway account and exporting its findings.
 */
export const DEMO_FINDINGS: readonly FindingIngest[] = [
    {
        tenderId: "CO1.REQ.10841106",
        entityId: "899999061",
        entityName: "ALCALDIA LOCAL DE ENGATIVÁ",
        kind: "OPORTUNIDAD",
        score: 85,
        title: "Oportunidad de contratación: Servicios profesionales de comunicación en Engativá",
        summary:
            "Proceso aprobado por la Alcaldía Local de Engativá por 28 millones de COP para diseñar y ejecutar estrategias de comunicación interna y externa. Actualmente no cuenta con proveedores asignados, representando una buena oportunidad de participación.",
        evidence: [
            {
                claim: "Proceso CO1.REQ.10841106 publicado en estado Aprobado con objeto de prestación de servicios profesionales de comunicación.",
                source: "Croma-SECOP",
            },
            {
                claim: "El presupuesto estimado es de 28.000.000 COP.",
                source: "Croma-SECOP",
            },
            {
                claim: "El proceso indica que aún no hay proveedores expuestos, confirmando que se encuentra en fase idónea para nuevas ofertas.",
                source: "Croma-SECOP",
            },
        ],
        graphEdges: [],
    },
    {
        tenderId: "CO1.NTC.10702117",
        entityId: "899999061",
        entityName: "ALCALDIA LOCAL DE KENNEDY",
        kind: "OPORTUNIDAD",
        score: 85,
        title: "Contrato de prestación de servicios sin alertas detectadas",
        summary:
            "Proceso de contratación de servicios profesionales de comunicación con la Alcaldía Local de Kennedy. La proveedora es una persona natural con experiencia previa en SECOP, sin sanciones ni antecedentes judiciales. La ausencia de registro en RUES es normal para profesionales independientes no comerciantes.",
        evidence: [
            {
                claim: "La Alcaldía Local de Kennedy estructuró el proceso CO1.NTC.10702117 por valor de 45333333 COP.",
                source: "SECOP",
            },
            {
                claim: "Angie Gabriela Moreno Gordillo registra 4 contratos históricos previos en el sistema.",
                source: "SECOP",
            },
            {
                claim: "No hay registro activo ni matrícula mercantil para la persona natural, lo cual es habitual en contratos de prestación de servicios profesionales.",
                source: "RUES",
            },
            {
                claim: "La proveedora no registra procesos judiciales en su contra (0 procesos).",
                source: "Rama Judicial",
            },
            {
                claim: "La proveedora registra 0 sanciones en los sistemas de control fiscal y disciplinario.",
                source: "Sanciones",
            },
        ],
        graphEdges: [
            {
                from: "1141315178",
                to: "899999061",
                relation: "adjudicatario",
            },
        ],
    },
    {
        tenderId: "CO1.NTC.10697961",
        entityId: "890905211",
        entityName:
            "DISTRITO ESPECIAL DE CIENCIA TECNOLOGIA E INNOVACION DE MEDELLIN",
        kind: "OPORTUNIDAD",
        score: 85,
        title: "Oportunidad de licitacion en infraestructura vial en Medellin",
        summary:
            "El proceso para la construccion del lazo descendente Palmas se encuentra en estado Publicado con una cuantia de 15118552353 COP. Al no existir proveedores adjudicados o inscritos expuestos actualmente, representa una oportunidad competitiva limpia sin banderas rojas identificadas en la fase inicial.",
        evidence: [
            {
                url: "https://community.secop.gov.co/",
                claim: "El proceso CO1.NTC.10697961 fue publicado por el DISTRITO ESPECIAL DE CIENCIA TECNOLOGIA E INNOVACION DE MEDELLIN por un valor de 15118552353 COP para la construccion del lazo descendente Palmas.",
                source: "Croma - SECOP",
            },
        ],
        graphEdges: [],
    },
    {
        tenderId: "CO1.NTC.10699364",
        entityId: "890905211",
        entityName:
            "DISTRITO ESPECIAL DE CIENCIA TECNOLOGIA E INNOVACION DE MEDELLIN",
        kind: "OPORTUNIDAD",
        score: 85,
        title: "Licitacion publica para mantenimiento de andenes en Medellin",
        summary:
            "El proceso se encuentra en fase de presentacion de ofertas por un valor cuantioso de 9004 millones de pesos. Al no existir proveedores preseleccionados o expuestos, representa una oportunidad limpia y altamente atractiva para empresas del sector construccion e ingenieria civil.",
        evidence: [
            {
                claim: "El proceso CO1.NTC.10699364 esta en fase de seleccion (Presentacion de ofertas) con un presupuesto asignado de 9004261977 COP y estado Publicado.",
                source: "Croma SECOP",
            },
        ],
        graphEdges: [],
    },
    {
        tenderId: "CO1.NTC.10702498",
        entityId: "890905211",
        entityName:
            "DISTRITO ESPECIAL DE CIENCIA TECNOLOGIA E INNOVACION DE MEDELLIN",
        kind: "BANDERA_ROJA",
        score: 80,
        title: "Riesgo por uso de Contrato Interadministrativo de Mandato",
        summary:
            "El proceso CO1.NTC.10702498 busca establecer un contrato interadministrativo de mandato sin representacion para un proyecto tecnologico. Esta figura representa un patron historico de riesgo en la contratacion publica colombiana, ya que suele utilizarse para eludir la licitacion publica competitiva requerida por la Ley 80 de 1993, permitiendo que la entidad mandataria subcontrate a terceros proveedores privados de forma directa o bajo regimenes de contratacion menos restrictivos.",
        evidence: [
            {
                url: "https://community.secop.gov.co/Public/Tendering/OpportunityDetail/Index?noticeUID=CO1.NTC.10702498",
                claim: "La entidad DISTRITO ESPECIAL DE CIENCIA TECNOLOGIA E INNOVACION DE MEDELLIN publico el proceso de contratacion con objeto 'Contrato interadministrativo de mandato sin representacion para la estructuracion; implementacion y puesta en funcionamiento de un centro de monitoreo' por valor de 496356183 COP.",
                source: "Croma-SECOP",
            },
        ],
        graphEdges: [],
    },
    {
        tenderId: "CO1.NTC.10697784",
        entityId: "890905211",
        entityName:
            "DISTRITO ESPECIAL DE CIENCIA TECNOLOGIA E INNOVACION DE MEDELLIN",
        kind: "BANDERA_ROJA",
        score: 75,
        title: "Riesgo de elusión del estatuto general de contratación vía mandato interadministrativo",
        summary:
            "El Distrito de Medellín utiliza un contrato interadministrativo de mandato sin representación para la planeación y ejecución de la Feria de la Transparencia por un valor de 537,500,000 COP. La selección de esta modalidad contractual para la logística de eventos constituye una bandera roja tipificada, ya que esta figura suele ser utilizada para trasladar recursos a otra entidad pública que termina subcontratando a terceros bajo un régimen de derecho privado, evadiendo la licitación pública y la pluralidad de oferentes exigida por la Ley 80. Paradójicamente, este mecanismo opaco se está empleando para un evento sobre transparencia. El proceso ya se encuentra en estado 'Seleccionado' sin revelar públicamente el proveedor final.",
        evidence: [
            {
                claim: "El proceso CO1.NTC.10697784 se tramita bajo la modalidad de contrato interadministrativo de mandato sin representación por un monto de 537,500,000 COP y se encuentra en estado Seleccionado sin proveedores finales expuestos.",
                source: "SECOP",
            },
        ],
        graphEdges: [],
    },
    {
        tenderId: "CO1.NTC.10700871",
        entityId: "899999061",
        entityName: "SECRETARIA DISTRITAL DE HACIENDA",
        kind: "BANDERA_ROJA",
        score: 65,
        title: "Alerta de transparencia: Proceso publicado con presupuesto de cero pesos",
        summary:
            "El proceso para la prestacion de servicios de produccion audiovisual fue publicado por la Secretaria Distrital de Hacienda con un valor de 0 COP. Esta anomalia en la plataforma SECOP sugiere un posible ocultamiento del presupuesto oficial o un error de estructuracion del proceso, lo cual afecta la transparencia y desincentiva la libre concurrencia de oferentes al no brindar claridad financiera sobre el contrato.",
        evidence: [
            {
                url: "https://community.secop.gov.co/Public/Tendering/OpportunityDetail/Index?noticeUID=CO1.NTC.10700871",
                claim: "El proceso CO1.NTC.10700871 indica que el valor COP es 0 y su estado es Publicado.",
                source: "Croma-SECOP",
            },
        ],
        graphEdges: [],
    },
    {
        tenderId: "CO1.NTC.10702463",
        entityId: "890905211",
        entityName:
            "DISTRITO ESPECIAL DE CIENCIA TECNOLOGIA E INNOVACION DE MEDELLIN",
        kind: "OPORTUNIDAD",
        score: 30,
        title: "Contrato Interadministrativo entre Distrito de Medellin e ITM para Educacion Inclusiva",
        summary:
            "El proceso evalua un contrato interadministrativo por un valor sustancial de 6.3 mil millones de pesos entre el Distrito de Medellin y la Institucion Universitaria ITM. El proveedor tiene un amplio historial de contratacion publica y no registra sanciones, lo que indica un perfil de bajo riesgo legal. Sin embargo, dada la modalidad interadministrativa y el objeto especifico de fortalecimiento institucional, se recomienda monitorear para mitigar el riesgo tipico de subcontratacion indebida a terceros privados.",
        evidence: [
            {
                claim: "El contrato CO1.NTC.10702463 se adjudica por la modalidad interadministrativa por un valor de COP 6348291157.",
                source: "SECOP",
            },
            {
                claim: "La Institucion Universitaria ITM (NIT 800214750) tiene un registro historico de 480 contratos en SECOP.",
                source: "SECOP",
            },
            {
                claim: "El proveedor no registra sanciones y mantiene 20 procesos judiciales activos, un numero dentro del margen normal para una entidad educativa publica de su tamano.",
                source: "Rama Judicial y Sanciones",
            },
        ],
        graphEdges: [
            {
                from: "800214750",
                to: "890905211",
                relation: "adjudicatario",
            },
        ],
    },
    {
        tenderId: "CO1.NTC.10697741",
        entityId: "890905211",
        entityName:
            "DISTRITO ESPECIAL DE CIENCIA TECNOLOGIA E INNOVACION DE MEDELLIN",
        kind: "OPORTUNIDAD",
        score: 10,
        title: "Arrendamiento inmobiliario de baja cuantia",
        summary:
            "Proceso para el arrendamiento de un bien inmueble del Distrito por un valor cercano a los 10.6 millones de pesos. No hay proveedores con alertas ni riesgo identificado hasta el momento.",
        evidence: [
            {
                claim: "El Distrito Especial de Medellin (NIT 890905211) publico el proceso CO1.NTC.10697741 por 10615080 COP para arrendamiento de inmueble.",
                source: "SECOP",
            },
        ],
        graphEdges: [],
    },
];
