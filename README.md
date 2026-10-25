# دروس حبيبي

**7bibiiii! Welcome to France !**

Un compagnon de français pour un grand débutant : cours, quiz et exercices, avec une traduction en arabe ou en darija marocaine écrite en lettres et chiffres.

Site statique conçu pour GitHub Pages. Aucun compte élève, abonnement, serveur applicatif, outil de compilation ou dépendance JavaScript nécessaire.

## Première utilisation

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Ouvrir <http://127.0.0.1:4173>. Un serveur HTTP est nécessaire pour charger les modules et le fichier de leçons ; ne pas ouvrir `index.html` par double-clic.

## Publier sur GitHub Pages

Le dépôt prévu est [NotThatMiko/Habibi-Welcome-to-France](https://github.com/NotThatMiko/Habibi-Welcome-to-France).

1. Déposer les fichiers du site à la racine du dépôt, sur la branche `main`.
2. Dans le dépôt, ouvrir **Settings → Pages**.
3. Sous **Build and deployment**, choisir **Deploy from a branch**, puis **main** et **/ (root)**. Enregistrer.
4. Attendre la fin du déploiement et ouvrir le lien indiqué par GitHub.

Adresse attendue une fois le déploiement confirmé : `https://notthatmiko.github.io/Habibi-Welcome-to-France/`.

Le fichier `.nojekyll` désactive le traitement Jekyll. Tous les chemins de ressources sont relatifs : le site fonctionne dans le sous-dossier du dépôt. Aucune clé ni aucun mot de passe GitHub ne doit être ajouté au code.

Référence : [création d’un site GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site).

## Ce qui est inclus

- Trois espaces : **Cours**, **Quiz** et **Exercices** ; choix du thème dans chacun.
- Deux thèmes de départ : neuf pronoms personnels ; être et avoir au présent.
- Équivalents en arabe et en darija, exemples du quotidien, repères de prononciation.
- 27 questions de quiz et 21 exercices, avec séances de neuf questions au maximum, tirées dans le thème choisi.
- Quiz sans sous-titres de traduction ; exercices de pronoms accompagnés d’un indice en arabe ou en darija. Correction dans les deux langues après validation.
- Écoute française via les petites icônes de haut-parleur dans les questions et les corrections. Dans les quiz, cliquer sur une réponse sert uniquement à la sélectionner ; les réponses en darija n’ont pas de lecture audio. Dans les exercices, l’écoute au choix peut être désactivée.
- Résultats, cours découverts et révision des dernières erreurs.
- Atelier de création de leçons, validation, essai local, import et export.
- Interface responsive, lecture de droite à gauche pour l’arabe, navigation au clavier et prise en compte de la réduction des animations.

L’écoute utilise les voix françaises de l’appareil quand la synthèse vocale est disponible. Des fichiers audio français sont aussi fournis pour les contenus publiés : ils prennent le relais dans les navigateurs sans synthèse vocale, notamment l’instance de Navigateur Mi signalée sur Android. Ils sont chargés à la demande et nécessitent une connexion. Les nouvelles leçons créées localement utilisent la synthèse vocale tant que leurs enregistrements n’ont pas été ajoutés au site. Les lettres arabes sont un repère approximatif, pas une transcription phonétique exacte. Les variantes de darija peuvent être ajustées avec le professeur.

La darija et l’arabe n’expriment souvent pas « être » au présent avec un verbe. Les correspondances sont donc données en contexte ; « on », « vous » et les groupes masculins ou féminins sont expliqués.

Référence pour les pronoms indépendants et l’absence de copule au présent : [manuel de darija du Peace Corps Morocco, page 7](https://www.friendsofmorocco.org/Docs/MorrocanArabicSept2016.pdf). La transcription en lettres et chiffres est adaptée à un usage courant.

## Ajouter une leçon chaque semaine

1. Ouvrir **Ajouter une leçon** dans le menu ordinateur ou en bas de la page sur téléphone.
2. Renseigner la semaine, le titre, la présentation et le récapitulatif dans les trois langues.
3. Ajouter des mots au cours si souhaité.
4. Ajouter les quiz et les exercices : question en français, bonne réponse, une à trois autres réponses, puis correction dans les trois langues. Dans les phrases à compléter, écrire **…** à la place du mot manquant.
5. Cliquer sur **Enregistrer et essayer**. La leçon est alors disponible sur cet appareil ; l’essayer dans Cours, Quiz et Exercices.
6. Dans l’atelier, cliquer sur **Télécharger les leçons**. Le fichier `custom-lessons.json` réunit les leçons déjà publiées et les copies locales enregistrées.
7. Dans GitHub, ouvrir le dossier **data**, puis **Add file → Upload files**. Glisser le fichier téléchargé pour remplacer `data/custom-lessons.json`, puis **Commit changes**.
8. Attendre le nouveau déploiement de GitHub Pages et recharger le site sur le téléphone.

Le formulaire ne publie pas directement dans GitHub. La publication nécessite ton compte GitHub. Les brouillons sont sauvegardés uniquement après **Enregistrer et essayer** ; exporter les leçons avant de vider les données du navigateur. Les modifications de formulaire non enregistrées restent en mémoire pendant la navigation dans le site ; quitter l’onglet déclenche un avertissement du navigateur.

Importer un fichier de leçons dans l’atelier permet de reprendre sa création sur un autre appareil. En cas de modification simultanée d’une même leçon sur deux appareils, utiliser une seule copie de référence avant l’export. Supprimer une copie locale ne supprime pas une leçon déjà publiée : pour retirer une leçon publiée, retirer son entrée du fichier `data/custom-lessons.json` sur GitHub.

## Transférer la progression

Dans **Ma progression** :

1. Sur le premier appareil, cliquer sur **Exporter ma progression**.
2. Envoyer le fichier JSON sur l’autre appareil avec AirDrop, messagerie ou un autre moyen habituel.
3. Ouvrir le site sur l’autre appareil et choisir **Importer ma progression**.

L’import réunit les résultats des deux appareils sans effacer ceux déjà présents. Réimporter le même fichier ne crée pas de doublons. Pour réunir les résultats dans les deux sens, exporter ensuite la progression réunie et l’importer sur le premier appareil.

Le transfert est **manuel**, sans synchronisation automatique. Les réponses vérifiées sont conservées même si une séance est interrompue ; une séance compte comme terminée uniquement après sa dernière question. Le taux de réussite porte sur toutes les réponses validées. La progression par thème utilise la dernière réponse donnée à chaque question. Une séance en cours ne reprend pas après rechargement.

Les données sont conservées dans le stockage local du navigateur. Effacer les données du navigateur, changer de navigateur ou d’adresse du site ne transfère pas les données. Penser à exporter régulièrement. Les fichiers de progression ne contiennent pas de compte ni de mot de passe.

Pour repartir de zéro sur cet appareil, choisir **Effacer ma progression** dans **Ma progression**, puis écrire exactement `7bibi` et confirmer. Les réponses, les séances et les cours marqués comme découverts sont effacés ; les leçons créées et les préférences sont conservées. Une sauvegarde exportée peut être réimportée ensuite.

## Fichiers

| Fichier | Rôle |
| --- | --- |
| `index.html` | Entrée du site |
| `styles.css` | Palette, mise en page ordinateur et mobile |
| `js/app.js` | Navigation, cours, sessions et progression |
| `js/content.js` | Contenu pédagogique initial et validation des leçons |
| `js/editor.js` | Formulaire de création et publication manuelle |
| `js/store.js` | Sauvegarde locale et fusion des progressions |
| `js/ui.js` | Sous-titres, icônes, synthèse vocale |
| `js/audio-manifest.js` | Correspondance entre textes français et fichiers audio |
| `assets/audio/fr/` | Enregistrements français AAC dans des fichiers M4A |
| `scripts/generate_audio.py` | Génération des enregistrements avec macOS |
| `js/config.js` | Nom du dépôt et branche GitHub, informations publiques |
| `data/custom-lessons.json` | Leçons ajoutées depuis l’atelier |

Les polices DM Sans et Noto Naskh Arabic sont chargées depuis Google Fonts ; des polices système sont prévues en repli. La palette est `#3D405B`, `#F4F1DE`, `#E07A5F`.

## Vérifications

Un test navigateur sans dépendance est fourni dans `tests/browser_check.py`. Il utilise Chrome installé sur macOS, un serveur local déjà lancé sur le port 4173 et une instance Chrome distante sur le port 9223. Il vérifie les quiz, les exercices, les sauvegardes, la fusion idempotente et la création de leçons. Il enregistre les captures dans `artifacts/` et réinitialise uniquement le profil de test.

```sh
python3 tests/browser_check.py
```

`python3 tests/audio_playback_check.py` vérifie séparément le décodage des enregistrements et leur lecture réelle dans Chrome avec les API de synthèse vocale désactivées. Le son de ce test est coupé ; le décodage et l’avancement du lecteur sont contrôlés. Cela ne remplace pas une vérification sur le téléphone Android concerné.

## Préparer l’audio d’une nouvelle leçon publiée

Après mise à jour de `data/custom-lessons.json`, démarrer le serveur local décrit plus haut et un profil Chrome de test dédié :

```sh
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --no-first-run --no-default-browser-check --disable-background-networking --remote-debugging-port=9223 --remote-allow-origins=http://localhost:9223 --user-data-dir=/private/tmp/habibi-audio-chrome about:blank
```

Dans un autre terminal sur macOS :

```sh
python3 scripts/generate_audio.py
python3 tests/audio_playback_check.py
```

Le script utilise la voix française Thomas de macOS, `say` et `afconvert`, sans service externe. Il réutilise les fichiers existants et génère les mots, les phrases, les questions et les lectures au choix des exercices. Publier ensemble `js/audio-manifest.js` et `assets/audio/fr/` avec la nouvelle leçon. Les chemins restent compatibles avec le sous-dossier GitHub Pages.
