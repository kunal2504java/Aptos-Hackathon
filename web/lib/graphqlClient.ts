import { request, GraphQLError } from "graphql-request";

export interface GraphQLResponse<T> {
  data: T | null;
  error: string | null;
  isSuccess: boolean;
}

export class GraphQLClient {
  private endpoint: string;
  private retries: number;
  private timeout: number;

  constructor(
    endpoint: string = process.env.NEXT_PUBLIC_GRAPH_URL || "",
    retries: number = 2,
    timeout: number = 10000
  ) {
    this.endpoint = endpoint;
    this.retries = retries;
    this.timeout = timeout;
  }

  async query<T>(
    query: string,
    variables?: Record<string, any>
  ): Promise<GraphQLResponse<T>> {
    if (!this.endpoint) {
      return {
        data: null,
        error: "GraphQL endpoint not configured",
        isSuccess: false,
      };
    }

    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const data = await request(this.endpoint, query, variables, {
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        return {
          data: data as T,
          error: null,
          isSuccess: true,
        };
      } catch (error) {
        console.error(`GraphQL request attempt ${attempt + 1} failed:`, error);

        if (attempt === this.retries) {
          let errorMessage = "Unknown GraphQL error";

          if (error instanceof GraphQLError) {
            errorMessage = error.message;
          } else if (error instanceof Error) {
            errorMessage = error.message;
          } else if (typeof error === "string") {
            errorMessage = error;
          }

          // Handle specific error cases
          if (errorMessage.includes("Not found")) {
            errorMessage = "The subgraph is not available or hasn't been deployed yet. Please check your GraphQL endpoint configuration.";
          } else if (errorMessage.includes("timeout") || errorMessage.includes("aborted")) {
            errorMessage = "Request timed out. Please try again.";
          } else if (errorMessage.includes("network")) {
            errorMessage = "Network error. Please check your internet connection.";
          }

          return {
            data: null,
            error: errorMessage,
            isSuccess: false,
          };
        }

        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    return {
      data: null,
      error: "Max retries exceeded",
      isSuccess: false,
    };
  }

  async isHealthy(): Promise<boolean> {
    try {
      const result = await this.query("{ _meta { hasIndexingErrors } }");
      return result.isSuccess;
    } catch {
      return false;
    }
  }
}

// Create a default client instance
export const graphqlClient = new GraphQLClient();