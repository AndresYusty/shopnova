"""Genera gráficas PNG a partir de los resultados JSON de k6.
Uso: python tests/performance/grafica.py   (requiere: pip install matplotlib)"""
import json, os
import matplotlib.pyplot as plt

base = os.path.dirname(__file__)
for nombre in ["resultado-carga", "resultado-estres"]:
    ruta = os.path.join(base, nombre + ".json")
    if not os.path.exists(ruta):
        continue
    m = json.load(open(ruta))["metrics"]
    d = m["http_req_duration"]["values"]
    etiquetas = ["min", "med", "avg", "p(90)", "p(95)", "max"]
    valores = [d.get(k, 0) for k in etiquetas]
    plt.figure(figsize=(7, 4))
    barras = plt.bar(etiquetas, valores, color="#4f46e5")
    plt.bar_label(barras, fmt="%.0f ms")
    plt.title(f"Tiempos de respuesta - {nombre}")
    plt.ylabel("milisegundos")
    plt.tight_layout()
    plt.savefig(os.path.join(base, nombre + ".png"), dpi=150)
    print("Gráfica generada:", nombre + ".png")
