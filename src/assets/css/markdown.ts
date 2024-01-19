import { css } from 'lit';

// https://raw.githubusercontent.com/markdowncss/air/master/css/air.css

export const markdown_css = css`

p,
.air-p {
  font-size: 0.9rem;
  margin-bottom: 1.2rem;
}

h1,
.air-h1,
h2,
.air-h2,
h3,
.air-h3,
h4,
.air-h4 {
  margin: 1.1rem 0 .5rem;
  font-weight: inherit;
  line-height: 1.2;
}

h1,
.air-h1 {
  margin-top: 0;
  font-size: 2rem;
}

h2,
.air-h2 {
  font-size: 1.72rem;
}

h3,
.air-h3 {
  font-size: 1.48rem;
}

h4,
.air-h4 {
  font-size: 1.27rem;
}

h5,
.air-h5 {
  font-size: 1.09rem;
}

h6,
.air-h6 {
  font-size: 0.94rem;
}

small,
.air-small {
  font-size: .707em;
}

/* https://github.com/mrmrs/fluidity */

img,
canvas,
iframe,
video,
svg,
select,
textarea {
  max-width: 100%;
}

#markdown {
  font-family: var(--sl-font-sans);
  font-weight: 300;
  font-size: 12px;
  line-height: 1.5;
  margin: 6rem auto 1rem;
  max-width: 48rem;
}

img {
  border-radius: 50%;
  height: 200px;
  margin: 0 auto;
  width: 200px;
}

a,
a:visited {
  color: #3498db;
}

a:hover,
a:focus,
a:active {
  color: #2980b9;
}

pre {
  background-color: #fafafa;
  padding: 1rem;
  text-align: left;
}

blockquote {
  margin: 0;
  border-left: 5px solid #7a7a7a;
  font-style: italic;
  padding: 1.33em;
  text-align: left;
}

ul,
ol,
li {
  text-align: left;
}

`;