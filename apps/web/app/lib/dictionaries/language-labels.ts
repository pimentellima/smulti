export const languageLabels = {
    en: '🇺🇸',
    'en-GB': '🇬🇧',
    'pt-BR': '🇧🇷',
    'pt-PT': '🇵🇹',
    es: '🇪🇸',
    'es-MX': '🇲🇽',
    fr: '🇫🇷',
    de: '🇩🇪',
    it: '🇮🇹',
    ja: '🇯🇵',
    ko: '🇰🇷',
    'zh-Hans': '🇨🇳',
    'zh-Hant': '🇹🇼',
    ru: '🇷🇺',
    ar: '🇸🇦',
    hi: '🇮🇳',
    tr: '🇹🇷',
    pl: '🇵🇱',
    nl: '🇳🇱',
    sv: '🇸🇪',
    fi: '🇫🇮',
    no: '🇳🇴',
    da: '🇩🇰',
    el: '🇬🇷',
    he: '🇮🇱',
    th: '🇹🇭',
    id: '🇮🇩',
    vi: '🇻🇳',
    uk: '🇺🇦',
    cs: '🇨🇿',
    hu: '🇭🇺',
    ro: '🇷🇴',
}

type LanguageKey = keyof typeof languageLabels

export const getLanguageLabel = (language: string): string => {
    const keys = Object.keys(languageLabels) as LanguageKey[]
    const key = keys.find((key) =>
        language.toLowerCase().includes(key.toLowerCase()),
    )
    return key ? languageLabels[key] : language
}
