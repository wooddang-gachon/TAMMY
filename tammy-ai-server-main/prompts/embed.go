// Package prompts embeds the dotprompt templates so the compiled binary is
// self-contained and needs no prompt files alongside it in the container.
package prompts

import "embed"

// FS holds every .prompt file in this directory. Files whose names start with
// an underscore are loaded as partials rather than executable prompts.
//
//go:embed *.prompt
var FS embed.FS
