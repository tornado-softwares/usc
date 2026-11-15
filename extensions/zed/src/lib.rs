use zed_extension_api::{self as zed, Result};

const SERVER_PATH: &str = "./compiler/src/lsp/server.ts";

struct UscExtension;

impl zed::Extension for UscExtension {
    fn new() -> Self {
        Self
    }

    fn language_server_command(
        &mut self,
        _id: &zed::LanguageServerId,
        worktree: &zed::Worktree,
    ) -> Result<zed::Command> {
        let bun = worktree.which("bun").ok_or("bun not found in PATH")?;
        Ok(zed::Command {
            command: bun,
            args: vec!["run".into(), SERVER_PATH.into(), "--stdio".into()],
            env: worktree.shell_env(),
        })
    }
}

zed::register_extension!(UscExtension);
