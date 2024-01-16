import { css } from 'lit';

export const output_css = css`
.output {
  display: block;
  padding: 5px;
  white-space: pre;
 
  font-size: 13px;
  font-family: 'menlo', consolas, 'DejaVu Sans Mono', monospace;
  font-family: 'menlo';
  line-height: 1.3077;

  overflow-x: auto;
  overflow-y: auto;
}
.exception {
  color: red;
}
.DEBUG {
  color: blue;
}
.INFO, .NOTSET {
  color: green;
}
.WARNING {
  color: purple;
}
.ERROR {
  color: red;
}
.CRITICAL {
  color: darkred;
}
`;
