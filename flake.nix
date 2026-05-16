{
  description = "Budget Internal Tool - Nuxt 4 with Neon DB";
  
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };
  
  outputs = { self, nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in {
        devShells.default = pkgs.mkShell {
          name = "budget-internal-tool-dev";
          
          packages = with pkgs; [
            nodejs_22
            pnpm
            typescript
            typescript-language-server
            vscode-langservers-extracted
            tailwindcss-language-server
            vtsls
            gnumake
            python3
            git
            curl
            jq
          ];
          
          shellHook = ''
            echo "Budget Internal Tool Development Environment"
            echo "Node: $(node --version)"
            echo "pnpm: $(pnpm --version)"
            echo ""
            
            # Load .env if it exists
            if [ -f ".env" ]; then
              echo "Loading environment from .env"
              set -a
              source .env
              set +a
              echo "Environment loaded"
            fi
            
            # Install dependencies if needed
            if [ ! -d "node_modules" ]; then
              echo "Installing dependencies..."
              pnpm install
            fi
            
            echo ""
            echo "Ready! Run: pnpm run dev"
          '';
        };
      });
}
