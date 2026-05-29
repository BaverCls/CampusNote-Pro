package campusnote.backend.CoreDocumentManagement;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class R2Properties {

    @Value("${campusnote.r2.enabled:false}")
    private boolean enabled;

    @Value("${campusnote.r2.endpoint:}")
    private String endpoint;

    @Value("${campusnote.r2.account-id:}")
    private String accountId;

    @Value("${campusnote.r2.access-key-id:}")
    private String accessKeyId;

    @Value("${campusnote.r2.secret-access-key:}")
    private String secretAccessKey;

    @Value("${campusnote.r2.bucket-name:}")
    private String bucketName;

    @Value("${campusnote.r2.region:auto}")
    private String region;

    @Value("${campusnote.r2.presigned-url-ttl-seconds:300}")
    private int presignedUrlTtlSeconds = 300;

    @Value("${campusnote.r2.max-file-size-mb:50}")
    private int maxFileSizeMb = 50;

    public boolean isEnabled() {
        return enabled;
    }

    public String getEndpoint() {
        return endpoint;
    }

    public String getAccountId() {
        return accountId;
    }

    public String getAccessKeyId() {
        return accessKeyId;
    }

    public String getSecretAccessKey() {
        return secretAccessKey;
    }

    public String getBucketName() {
        return bucketName;
    }

    public String getRegion() {
        return region;
    }

    public int getPresignedUrlTtlSeconds() {
        return presignedUrlTtlSeconds;
    }

    public int getMaxFileSizeMb() {
        return maxFileSizeMb;
    }
}
