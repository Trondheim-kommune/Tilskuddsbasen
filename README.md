Tilskuddsbasen (og Aktørbasen)
================================

Dette er kildekoden bak Tilskuddsbasen og Aktørbasen til Trondheim Kommune (TK)

TK tar i utgangspunktet ikke imot pull requests (forslag til endringer eller ny funksjonalitet) via GitHub.
TK kan derimot kontaktes via _digitalt punktum forstevalg alfakrøll trondheim punktum kommune punktum no_
TK vil kun innlemme forslag til endringer etc. i koden om TK finner dette hensiktsmessig.

Les mer om Tilskuddsbasen [her](http://www.trondheim.kommune.no/tilskuddsbasen) 
eller besøke [her](https://tilskudd.trondheim.kommune.no/)

Tilskuddsbasen består av en rekke mikrotjenester som helt eller delvis deles med Aktørbasen og Bookingbasen.
Tjenestene tilskuddsbasen benytter seg av som er publisert her er:
* Autentisering (flod_auth)
* Email (flod_email)
* Organisasjoner (flod_organisations)
* Sak (flod_sak)
* Oppgaver (flod_tasks)

Frontend som bruker disse tjenestene via REST API er portalen (flod_tilskudd_portal)

Aktørbasen er også en del av koden (i katalogen flod_aktor_frontend), som du kan lese mer om [her](http://www.trondheim.kommune.no/aktorbasen/)
og besøke [her](https://organisasjoner.trondheim.kommune.no/)

Aktørbasen er hovedsaklig en frontend (flod_aktor_frontend), og benytter seg av mikrotjenestene:
* Autentisering
* Organisasjoner

flod_common er delt kode mellom Tilskuddsbasen, Aktørbasen og Bookingbasen.
