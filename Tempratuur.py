from machine import ADC # type: ignore
import utime # type: ignore

# Interne sensor (Pico chip)
interne_sensor = ADC(4)  
prop = 3.3 / 65535  # Conversiefactor voor ADC

# Externe TMP36 sensor (GP26)
externe_sensor = ADC(26)

def lees_interne_temperatuur():
    v_out = interne_sensor.read_u16() * prop  # Meet spanning
    temp = 27 - (v_out - 0.706) / 0.001721  # Omrekening naar Celsius
    return temp

def lees_externe_temperatuur(aantal_metingen=10):
    totaal = 0
    for _ in range(aantal_metingen):  # Neem meerdere metingen
        v_out = externe_sensor.read_u16() * prop  # Meet spanning
        temp = (100 * v_out) - 43  # TMP36-formule
        totaal += temp
        utime.sleep(0.05)  # Wacht kort tussen metingen
    return totaal / aantal_metingen  # Bereken gemiddelde temperatuur

while True:
    interne_temp = lees_interne_temperatuur()
    externe_temp = lees_externe_temperatuur()
    
    print(f"Interne temp: {interne_temp:.2f} °C | Externe temp: {externe_temp:.2f} °C")
    
    utime.sleep(1)  # Wacht 1 seconde voor de volgende meting


