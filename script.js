// ============================================================================
// Schreibrichtung ändern
// ============================================================================

const richtungUmschalter = document.getElementById("richtung-umschalter");

function aktualisiereUmschalterText(richtung) {
  richtungUmschalter.textContent = `Schreibrichtung umschalten (aktuell: ${richtung.toUpperCase()})`;
}

aktualisiereUmschalterText(document.documentElement.dir);

richtungUmschalter.addEventListener("click", () => {
  const neueRichtung = document.documentElement.dir === "rtl" ? "ltr" : "rtl";
  document.documentElement.dir = neueRichtung;
  aktualisiereUmschalterText(neueRichtung);
});

// ============================================================================
// DOM-Elemente
// ============================================================================

const tabellenKoerper = document.getElementById("emissionen-tbody");
const sucheEingabe = document.getElementById("filter-suche");
const landAuswahl = document.getElementById("filter-land");
const typAuswahl = document.getElementById("filter-typ");
const filterFormular = document.getElementById("filter-formular");
const sortierButtons = document.querySelectorAll(".sort-button");

// ============================================================================
// Erlaubte Filterwerte
// ============================================================================

const erlaubteLaender = Array.from(landAuswahl.options).map((option) => option.value);
const erlaubteTypen = Array.from(typAuswahl.options).map((option) => option.value);

// ============================================================================
// Aktueller Filter- und Sortierzustand
// ============================================================================

const zustand = {
  suche: "",
  land: "Alle",
  typ: "Alle",
  sortierSpalte: null,
  sortierRichtung: "asc",
};

// ============================================================================
// Ausgangsdaten aus der Tabelle lesen
// ============================================================================

function leseZeilenAusTabelle() {
  return Array.from(tabellenKoerper.querySelectorAll("tr")).map((zeile) => {
    const zellen = zeile.querySelectorAll("td");
    return {
      name: zellen[0].textContent.trim(),
      typ: zellen[1].textContent.trim(),
      land: zellen[2].textContent.trim(),
      emissionen: Number(zellen[3].textContent.trim()),
    };
  });
}

// Die Ausgangsdaten werden einmalig eingelesen und anschließend nicht mehr verändert.
// Filterung und Sortierung erfolgen auf Basis dieser unveränderten Daten.
const alleZeilen = leseZeilenAusTabelle();

// ============================================================================
// Tabelle darstellen
// ============================================================================

// Die Tabelle wird vollständig neu aufgebaut. textContent verhindert,
// dass Werte als HTML interpretiert werden.

function zeigeZeilenAn(zeilen) {
  tabellenKoerper.replaceChildren();

  if (zeilen.length === 0) {
    const leerZeile = document.createElement("tr");
    const leerZelle = document.createElement("td");
    leerZelle.colSpan = 4;
    leerZelle.className = "text-center text-muted";
    leerZelle.textContent = "Keine Einträge gefunden.";
    leerZeile.appendChild(leerZelle);
    tabellenKoerper.appendChild(leerZeile);
    return;
  }

  const fragment = document.createDocumentFragment();
  zeilen.forEach((zeile) => {
    const tr = document.createElement("tr");
    const werte = [
      zeile.name,
      zeile.typ,
      zeile.land,
      zeile.emissionen.toLocaleString("de-DE"),
    ];
    werte.forEach((wert) => {
      const td = document.createElement("td");
      td.textContent = wert;
      tr.appendChild(td);
    });
    fragment.appendChild(tr);
  });
  tabellenKoerper.appendChild(fragment);
}

// ============================================================================
// Suche, Filter und Sortierung
// ============================================================================

function aktualisiereTabelle() {
  // Zuerst werden die Ausgangsdaten anhand der aktuell gewählten Filter eingeschränkt.
  let zeilen = alleZeilen.filter((zeile) => {
    const passtZurSuche =
        zustand.suche === "" ||
        zeile.name.toLowerCase().includes(zustand.suche) ||
        zeile.land.toLowerCase().includes(zustand.suche);
    const passtZuLand = zustand.land === "Alle" || zeile.land === zustand.land;
    const passtZuTyp = zustand.typ === "Alle" || zeile.typ === zustand.typ;
    return passtZurSuche && passtZuLand && passtZuTyp;
  });

  if (zustand.sortierSpalte) {
    // slice() erstellt eine Kopie, damit die ursprünglichen Ausgangsdaten
    // durch die Sortierung nicht verändert werden.
    zeilen = zeilen.slice().sort((a, b) => {
      // Die Sortierspalte wird dynamisch über den im Zustand gespeicherten Schlüssel ausgewählt.
      const wertA = a[zustand.sortierSpalte];
      const wertB = b[zustand.sortierSpalte];
      const vergleich =
        typeof wertA === "number" ? wertA - wertB : wertA.localeCompare(wertB, "de");
      return zustand.sortierRichtung === "asc" ? vergleich : -vergleich;
    });
  }

  zeigeZeilenAn(zeilen);
}

// ============================================================================
// Such- und Filterereignisse
// ============================================================================

sucheEingabe.addEventListener("input", () => {
  zustand.suche = sucheEingabe.value.trim().toLowerCase();
  aktualisiereTabelle();
});

landAuswahl.addEventListener("change", () => {
  zustand.land = erlaubteLaender.includes(landAuswahl.value) ? landAuswahl.value : "Alle";
  aktualisiereTabelle();
});

typAuswahl.addEventListener("change", () => {
  zustand.typ = erlaubteTypen.includes(typAuswahl.value) ? typAuswahl.value : "Alle";
  aktualisiereTabelle();
});

// ============================================================================
// Formular zurücksetzen
// ============================================================================

filterFormular.addEventListener("reset", () => {
  // Der native Formular-Reset wird zuerst ausgeführt. Durch setTimeout(..., 0)
  // wird die Aktualisierung des JavaScript-Zustands in den nächsten Event-Loop-
  // Durchlauf verschoben, sodass die Formularfelder bereits zurückgesetzt sind.
  window.setTimeout(() => {
    zustand.suche = "";
    zustand.land = "Alle";
    zustand.typ = "Alle";
    zustand.sortierSpalte = null;
    zustand.sortierRichtung = "asc";
    setzeSortierAnzeigeZurueck();
    aktualisiereTabelle();
  }, 0);
});

function setzeSortierAnzeigeZurueck() {
  sortierButtons.forEach((button) => {
    button.closest("th").setAttribute("aria-sort", "none");
    button.querySelector(".sort-indicator").textContent = "";
  });
}

// ============================================================================
// Tabellensortierung
// ============================================================================

sortierButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const spalte = button.dataset.sortKey;

    if (zustand.sortierSpalte === spalte) {
      zustand.sortierRichtung = zustand.sortierRichtung === "asc" ? "desc" : "asc";
    } else {
      zustand.sortierSpalte = spalte;
      zustand.sortierRichtung = "asc";
    }

    sortierButtons.forEach((anderer) => {
      const th = anderer.closest("th");
      const indikator = anderer.querySelector(".sort-indicator");
      if (anderer === button) {
        th.setAttribute("aria-sort", zustand.sortierRichtung === "asc" ? "ascending" : "descending");
        indikator.textContent = zustand.sortierRichtung === "asc" ? "▲" : "▼";
      } else {
        th.setAttribute("aria-sort", "none");
        indikator.textContent = "";
      }
    });

    aktualisiereTabelle();
  });
});

// ============================================================================
// Initialisierung
// ============================================================================

aktualisiereTabelle();