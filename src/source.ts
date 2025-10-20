import Gio from "gi://Gio";

export enum Parsers {
    Json,
    NewLineWithTabs,
};

export interface JsonCommodity {
    name: string | undefined;
    price: string | string[];
    change: string | string[];
    pchange: string | string[];
    close: string | string[] | undefined;
    unit: string | string[] | undefined;
    goldRatio: string | string[] | undefined;
}

export interface CsvCommodity {
    name: { column: string, value: string };
    ask: number;
    bid: number;
    high: number;
    close: number;
};

export interface Source {
    name: string;
    method: string;
    parser: Parsers;
    commodities: Map<string | string[], JsonCommodity | CsvCommodity>;
    currencyMappings: Map<string, string>;
    getUrl: (settings: Gio.Settings) => string;
    getHeaders: (settings: Gio.Settings) => Map<string, string>;
    getBody: ((settings: Gio.Settings) => Map<string, any>) | undefined;
    getItems: (jsonData: any) => Map<string, any>;
}

export const CurrencyMappings: Map<string, string> = new Map([
    ['USD', 'United States Dollar'],
    ['AED', 'United Arab Emirates Dirham'],
    ['AFN', 'Afghan Afghani'],
    ['ALL', 'Albanian Lek'],
    ['AMD', 'Armenian Dram'],
    ['ANG', 'Netherlands Antillean Guilder'],
    ['AOA', 'Angolan Kwanza'],
    ['ARS', 'Argentine Peso'],
    ['AUD', 'Australian Dollar'],
    ['AWG', 'Aruban Florin'],
    ['AZN', 'Azerbaijani Manat'],
    ['BAM', 'Bosnia-Herzegovina Convertible Mark'],
    ['BBD', 'Barbadian Dollar'],
    ['BDT', 'Bangladeshi Taka'],
    ['BGN', 'Bulgarian Lev'],
    ['BHD', 'Bahraini Dinar'],
    ['BIF', 'Burundian Franc'],
    ['BMD', 'Bermudan Dollar'],
    ['BND', 'Brunei Dollar'],
    ['BOB', 'Bolivian Boliviano'],
    ['BRL', 'Brazilian Real'],
    ['BSD', 'Bahamian Dollar'],
    ['BTN', 'Bhutanese Ngultrum'],
    ['BWP', 'Botswanan Pula'],
    ['BYN', 'New Belarusian Ruble'],
    ['BZD', 'Belize Dollar'],
    ['CAD', 'Canadian Dollar'],
    ['CDF', 'Congolese Franc'],
    ['CHF', 'Swiss Franc'],
    ['CLP', 'Chilean Peso'],
    ['CNY', 'Chinese Yuan'],
    ['COP', 'Colombian Peso'],
    ['CRC', 'Costa Rican Colón'],
    ['CUC', 'Cuban Convertible Peso'],
    ['CUP', 'Cuban Peso'],
    ['CVE', 'Cape Verdean Escudo'],
    ['CZK', 'Czech Republic Koruna'],
    ['DJF', 'Djiboutian Franc'],
    ['DKK', 'Danish Krone'],
    ['DOP', 'Dominican Peso'],
    ['DZD', 'Algerian Dinar'],
    ['EGP', 'Egyptian Pound'],
    ['ERN', 'Eritrean Nakfa'],
    ['ETB', 'Ethiopian Birr'],
    ['EUR', 'Euro'],
    ['FJD', 'Fijian Dollar'],
    ['FKP', 'Falkland Islands Pound'],
    ['GBP', 'British Pound Sterling'],
    ['GEL', 'Georgian Lari'],
    ['GGP', 'Guernsey Pound'],
    ['GHS', 'Ghanaian Cedi'],
    ['GIP', 'Gibraltar Pound'],
    ['GMD', 'Gambian Dalasi'],
    ['GNF', 'Guinean Franc'],
    ['GTQ', 'Guatemalan Quetzal'],
    ['GYD', 'Guyanaese Dollar'],
    ['HKD', 'Hong Kong Dollar'],
    ['HNL', 'Honduran Lempira'],
    ['HRK', 'Croatian Kuna'],
    ['HTG', 'Haitian Gourde'],
    ['HUF', 'Hungarian Forint'],
    ['IDR', 'Indonesian Rupiah'],
    ['ILS', 'Israeli New Sheqel'],
    ['IMP', 'Manx pound'],
    ['INR', 'Indian Rupee'],
    ['IQD', 'Iraqi Dinar'],
    ['IRR', 'Iranian Rial'],
    ['ISK', 'Icelandic Króna'],
    ['JEP', 'Jersey Pound'],
    ['JMD', 'Jamaican Dollar'],
    ['JOD', 'Jordanian Dinar'],
    ['JPY', 'Japanese Yen'],
    ['KES', 'Kenyan Shilling'],
    ['KGS', 'Kyrgystani Som'],
    ['KHR', 'Cambodian Riel'],
    ['KMF', 'Comorian Franc'],
    ['KPW', 'North Korean Won'],
    ['KRW', 'South Korean Won'],
    ['KWD', 'Kuwaiti Dinar'],
    ['KYD', 'Cayman Islands Dollar'],
    ['KZT', 'Kazakhstani Tenge'],
    ['LAK', 'Laotian Kip'],
    ['LBP', 'Lebanese Pound'],
    ['LKR', 'Sri Lankan Rupee'],
    ['LRD', 'Liberian Dollar'],
    ['LSL', 'Lesotho Loti'],
    ['LYD', 'Libyan Dinar'],
    ['MAD', 'Moroccan Dirham'],
    ['MDL', 'Moldovan Leu'],
    ['MGA', 'Malagasy Ariary'],
    ['MKD', 'Macedonian Denar'],
    ['MMK', 'Myanma Kyat'],
    ['MNT', 'Mongolian Tugrik'],
    ['MOP', 'Macanese Pataca'],
    ['MRO', 'Mauritanian Ouguiya'],
    ['MUR', 'Mauritian Rupee'],
    ['MVR', 'Maldivian Rufiyaa'],
    ['MWK', 'Malawian Kwacha'],
    ['MXN', 'Mexican Peso'],
    ['MYR', 'Malaysian Ringgit'],
    ['MZN', 'Mozambican Metical'],
    ['NAD', 'Namibian Dollar'],
    ['NGN', 'Nigerian Naira'],
    ['NIO', 'Nicaraguan Córdoba'],
    ['NOK', 'Norwegian Krone'],
    ['NPR', 'Nepalese Rupee'],
    ['NZD', 'New Zealand Dollar'],
    ['OMR', 'Omani Rial'],
    ['PAB', 'Panamanian Balboa'],
    ['PEN', 'Peruvian Nuevo Sol'],
    ['PGK', 'Papua New Guinean Kina'],
    ['PHP', 'Philippine Peso'],
    ['PKR', 'Pakistani Rupee'],
    ['PLN', 'Polish Zloty'],
    ['PYG', 'Paraguayan Guarani'],
    ['QAR', 'Qatari Rial'],
    ['RON', 'Romanian Leu'],
    ['RSD', 'Serbian Dinar'],
    ['RUB', 'Russian Ruble'],
    ['RWF', 'Rwandan Franc'],
    ['SAR', 'Saudi Riyal'],
    ['SBD', 'Solomon Islands Dollar'],
    ['SCR', 'Seychellois Rupee'],
    ['SDG', 'Sudanese Pound'],
    ['SEK', 'Swedish Krona'],
    ['SGD', 'Singapore Dollar'],
    ['SHP', 'Saint Helena Pound'],
    ['SLL', 'Sierra Leonean Leone'],
    ['SOS', 'Somali Shilling'],
    ['SRD', 'Surinamese Dollar'],
    ['STD', 'São Tomé and Príncipe Dobra'],
    ['SVC', 'Salvadoran Colón'],
    ['SYP', 'Syrian Pound'],
    ['SZL', 'Swazi Lilangeni'],
    ['THB', 'Thai Baht'],
    ['TJS', 'Tajikistani Somoni'],
    ['TMT', 'Turkmenistani Manat'],
    ['TND', 'Tunisian Dinar'],
    ['TOP', 'Tongan Paʻanga'],
    ['TRY', 'Turkish Lira'],
    ['TTD', 'Trinidad and Tobago Dollar'],
    ['TWD', 'New Taiwan Dollar'],
    ['TZS', 'Tanzanian Shilling'],
    ['UAH', 'Ukrainian Hryvnia'],
    ['UGX', 'Ugandan Shilling'],
    ['USD', 'United States Dollar'],
    ['UYU', 'Uruguayan Peso'],
    ['UZS', 'Uzbekistan Som'],
    ['VEF', 'Venezuelan Bolívar Fuerte'],
    ['VND', 'Vietnamese Dong'],
    ['VUV', 'Vanuatu Vatu'],
    ['WST', 'Samoan Tala'],
    ['XAF', 'CFA Franc BEAC'],
    ['XCD', 'East Caribbean Dollar'],
    ['XOF', 'CFA Franc BCEAO'],
    ['XPF', 'CFP Franc'],
    ['YER', 'Yemeni Rial'],
    ['ZAR', 'South African Rand'],
    ['ZMW', 'Zambian Kwacha'],
]);

function _commonHeaders(settings: Gio.Settings): Map<string, string> {
    return new Map<string, string>([
        ['User-Agent', 'Mozilla/5.0 (X11; Linux x86_64; rv:143.0) Gecko/20100101 Firefox/143.0'],
        ['Cache-Control', 'no-cache'],
        ['content-type', 'application/json'],
    ]);
}

function _queryId(settings: Gio.Settings) {
    return {
        timestamp: Math.trunc(Date.now() / 1000),
        currency: settings.get_string('currency'),
    };
}

export const SourceMappings: Map<string, Source> = new Map([
    [
        'goldprice.org', {
            name: 'goldprice.org',
            method: 'GET',
            parser: Parsers.Json,
            commodities: new Map([
                ['gold', {
                    name: 'gold',
                    price: 'xauPrice',
                    change: 'chgXau',
                    pchange: 'pcXau',
                    close: 'xauClose',
                    unit: undefined,
                    goldRatio: undefined,
                }],
                ['silver', {
                    name: 'silver',
                    price: 'xagPrice',
                    change: 'chgXag',
                    pchange: 'pcXag',
                    close: 'xagClose',
                    unit: undefined,
                    goldRatio: undefined,
                }]
            ]),
            currencyMappings: new Map<string, string>(),
            getUrl(settings: Gio.Settings): string {
                const currency = settings.get_string('currency');
                return `https://data-asg.goldprice.org/dbXRates/${currency}`;
            },
            getHeaders: _commonHeaders,
            getBody: undefined,
            getItems(jsonData: any): Map<string, any> {
                return new Map([
                    ['gold', jsonData['items'][0]],
                    ['silver', jsonData['items'][0]],
                ]);
            },
        }
    ], [
        'kitco.com', {
            name: 'kitco.com',
            method: 'POST',
            parser: Parsers.Json,
            commodities: new Map([
                [
                    ['gold', 'silver', 'platinum', 'palladium', 'rhodium'], {
                        name: 'gold',
                        price: 'bid',
                        change: 'change',
                        pchange: 'changePercentage',
                        close: undefined,
                        unit: undefined,
                        goldRatio: undefined,
                    }
                ],
            ]),
            currencyMappings: new Map<string, string>(),
            getUrl(settings: Gio.Settings): string {
                return 'https://kdb-gw.prod.kitco.com/';
            },
            getHeaders(settings: Gio.Settings): Map<string, string> {
                const headers = _commonHeaders(settings);
                const xQueryId = _queryId(settings);
                headers.set('x-query-id', JSON.stringify(xQueryId));
                return headers;
            },
            getBody(settings: Gio.Settings): Map<string, any> {
                return new Map<string, any>([
                    ['query', 'fragment MetalFragment on Metal{ID symbol currency name results{...MetalQuoteFragment}}fragment MetalQuoteFragment on Quote{ID ask bid change changePercentage close high low mid open originalTime timestamp unit}query AllMetalsQuote($currency:String!, $timestamp:Int){gold:GetMetalQuoteV3(symbol:"AU" timestamp:$timestamp currency:$currency){...MetalFragment}silver:GetMetalQuoteV3(symbol:"AG" timestamp:$timestamp currency:$currency){...MetalFragment}platinum:GetMetalQuoteV3(symbol:"PT" timestamp:$timestamp currency:$currency){...MetalFragment}palladium:GetMetalQuoteV3(symbol:"PD" timestamp:$timestamp currency:$currency){...MetalFragment}rhodium:GetMetalQuoteV3(symbol:"RH" timestamp:$timestamp currency:$currency){...MetalFragment}}'],
                    ['variables', _queryId(settings)],
                    ['operationName', 'AllMetalsQuote'],
                ]);
            },
            getItems(jsonData: any): Map<string, any> {
                const result = new Map<string, any>();
                const data = jsonData['data'];
                Object.entries(jsonData['data']).forEach(([metal, value]) => {
                    result.set(metal, (value as any)['results'][0]);
                });
                return result;
            },
        }
    ],
]);
