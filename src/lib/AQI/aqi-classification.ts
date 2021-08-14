export function aqiClassification(aqi: number): string {
  if (!aqi || aqi <= 0) return 'ไม่สามารถแปลผลได้';
  if (aqi > 0 && aqi <= 50) return 'ดี';
  if (aqi > 50 && aqi <= 100) return 'ปานกลาง';
  if (aqi > 100 && aqi <= 150) return 'มีผลกระทบต่อสุขภาพในกลุ่มเสี่ยง';
  if (aqi > 150 && aqi <= 200) return 'มีผลกระทบต่อสุขภาพ';
  if (aqi > 200 && aqi <= 300) return 'มีผลกระทบต่อสุขภาพอย่างรุนแรง';
  return 'มีผลกระทบต่อสุขภาพอย่างรุนแรงอย่างที่สุด ควรหลีกเลี่ยงกิจกรรมกลางแจ้งอย่างเด็ดขาด';
}

export function isUnhealthy(aqi: number) {
  if (!aqi) return false;
  return aqi > 100;
}
