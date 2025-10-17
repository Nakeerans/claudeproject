import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';
import { logger } from './logger.js';

/**
 * CloudWatch Monitoring Integration
 */
export class MonitoringService {
  constructor() {
    this.cloudwatch = new CloudWatchClient({
      region: process.env.AWS_REGION || 'us-east-1'
    });
    this.namespace = 'AutonomousAI';
    this.enabled = process.env.NODE_ENV === 'production';
  }

  /**
   * Send custom metric to CloudWatch
   */
  async sendMetric(metricName, value, unit = 'Count', dimensions = {}) {
    if (!this.enabled) {
      logger.debug('Monitoring disabled in non-production environment');
      return;
    }

    try {
      const params = {
        Namespace: this.namespace,
        MetricData: [
          {
            MetricName: metricName,
            Value: value,
            Unit: unit,
            Timestamp: new Date(),
            Dimensions: Object.entries(dimensions).map(([Name, Value]) => ({
              Name,
              Value: String(Value)
            }))
          }
        ]
      };

      await this.cloudwatch.send(new PutMetricDataCommand(params));
      logger.debug(`Metric sent: ${metricName}=${value}`);
    } catch (error) {
      logger.error('Failed to send metric to CloudWatch', {
        metric: metricName,
        error: error.message
      });
    }
  }

  /**
   * Track API request
   */
  async trackRequest(endpoint, duration, statusCode) {
    await this.sendMetric('APIRequest', 1, 'Count', {
      Endpoint: endpoint,
      StatusCode: statusCode
    });

    await this.sendMetric('APILatency', duration, 'Milliseconds', {
      Endpoint: endpoint
    });
  }

  /**
   * Track AI operation
   */
  async trackAIOperation(operation, tokensUsed, success) {
    await this.sendMetric('AIOperation', 1, 'Count', {
      Operation: operation,
      Success: success
    });

    if (tokensUsed) {
      await this.sendMetric('AITokensUsed', tokensUsed, 'Count', {
        Operation: operation
      });
    }
  }

  /**
   * Track scraping operation
   */
  async trackScraping(url, success, duration) {
    await this.sendMetric('ScrapingOperation', 1, 'Count', {
      Success: success
    });

    await this.sendMetric('ScrapingDuration', duration, 'Milliseconds');
  }

  /**
   * Track error
   */
  async trackError(errorType, endpoint = 'unknown') {
    await this.sendMetric('ErrorCount', 1, 'Count', {
      ErrorType: errorType,
      Endpoint: endpoint
    });
  }

  /**
   * Health check metrics
   */
  async sendHealthMetrics(modules) {
    for (const [module, status] of Object.entries(modules)) {
      await this.sendMetric('ModuleHealth', status ? 1 : 0, 'Count', {
        Module: module
      });
    }
  }
}

/**
 * Rollback mechanism for failed deployments
 */
export class RollbackManager {
  constructor() {
    this.history = [];
    this.maxHistory = 10;
  }

  /**
   * Save deployment state
   */
  saveDeploymentState(state) {
    this.history.push({
      ...state,
      timestamp: new Date(),
      id: Date.now()
    });

    // Keep only last N deployments
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    logger.info('Deployment state saved', { id: state.id });
  }

  /**
   * Rollback to previous state
   */
  async rollback(steps = 1) {
    if (this.history.length < steps) {
      throw new Error('Not enough deployment history for rollback');
    }

    const targetState = this.history[this.history.length - steps - 1];
    logger.info('Initiating rollback', {
      target: targetState.id,
      steps
    });

    // Implement rollback logic here
    // This would typically involve:
    // 1. Stop current services
    // 2. Restore previous code version
    // 3. Restore previous configuration
    // 4. Restart services
    // 5. Verify health

    return targetState;
  }

  /**
   * Get deployment history
   */
  getHistory() {
    return this.history;
  }
}
