/**
 * Utilitaires pour le calcul et formattage des dates / DLC HACCP
 */

export class DateUtils {
  static getTodayISO() {
    const d = new Date();
    return d.toISOString().split('T')[0];
  }

  static getNowTime() {
    const d = new Date();
    return d.toTimeString().slice(0, 5); // HH:MM
  }

  static calculateSecondaryDLC(daysToAdd = 3) {
    const d = new Date();
    d.setDate(d.getDate() + Number(daysToAdd));
    return d.toISOString().split('T')[0];
  }

  static generateLotNumber() {
    const d = new Date();
    const year = String(d.getFullYear()).slice(-2);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    return `L${year}${month}${day}-${randomSuffix}`;
  }

  /**
   * Calcule l'écart en minutes entre deux horaires "HH:MM"
   */
  static diffMinutes(startTime, endTime) {
    if (!startTime || !endTime) return 0;
    const [h1, m1] = startTime.split(':').map(Number);
    const [h2, m2] = endTime.split(':').map(Number);
    if (isNaN(h1) || isNaN(m1) || isNaN(h2) || isNaN(m2)) return 0;
    let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (diff < 0) {
      diff += 24 * 60; // Gestion passage minuit
    }
    return diff;
  }
}

