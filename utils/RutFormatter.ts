export const formatearRut = (rut: string | undefined): string => {
  if (rut === undefined) return ''
  const newRut: string = String(rut.replace(/\./g, '').replace('-', '').replace('K', 'k'))
  if (newRut.length >= 8) {
    const digitVerif: string = newRut.slice(-1)
    const rutBody: string = newRut.slice(0, -1)
    const rutFormatted: string = rutBody.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
    return `${rutFormatted}-${digitVerif}`
  }
  return rut
}

export const handleRutDown = (e: React.KeyboardEvent) => {
  const target = e.target as HTMLInputElement;
  if (e.key === '-' && target.value.includes('-')) {
    e.preventDefault();
    return;
  }

  if (!/[0-9kK.-]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Tab' && e.key !== 'Delete' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
    e.preventDefault();
  }
}

export const validarDigV = (T: number) => {
  let M = 0, S = 1;
  for (; T; T = Math.floor(T / 10))
    S = (S + T % 10 * (9 - M++ % 6)) % 11;
  return S ? S - 1 : 'k';
}