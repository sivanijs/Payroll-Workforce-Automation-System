export function calculateNetSalary(grossSalary, pf, tax) {
  return Number((Number(grossSalary || 0) - Number(pf || 0) - Number(tax || 0)).toFixed(2));
}
                                                                                        
      