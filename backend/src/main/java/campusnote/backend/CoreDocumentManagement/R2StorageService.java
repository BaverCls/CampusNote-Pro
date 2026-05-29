package campusnote.backend.CoreDocumentManagement;

import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.ResponseBytes;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;

import java.net.URI;
import java.time.Duration;

@Service
public class R2StorageService {

    private final R2Properties r2Properties;
    private S3Client s3Client;
    private S3Presigner s3Presigner;

    public R2StorageService(R2Properties r2Properties) {
        this.r2Properties = r2Properties;
        if (r2Properties.isEnabled()) {
            initClients();
        }
    }

    private void initClients() {
        if (r2Properties.getAccessKeyId() == null || r2Properties.getAccessKeyId().isBlank() ||
            r2Properties.getSecretAccessKey() == null || r2Properties.getSecretAccessKey().isBlank()) {
            throw new IllegalStateException("Cloudflare R2 is enabled but credentials are not configured.");
        }

        AwsBasicCredentials credentials = AwsBasicCredentials.create(
                r2Properties.getAccessKeyId(),
                r2Properties.getSecretAccessKey()
        );

        // Region auto is ignored by R2 but AWS SDK requires a valid region format
        String regionStr = r2Properties.getRegion();
        Region region = (regionStr == null || regionStr.isBlank() || "auto".equalsIgnoreCase(regionStr)) 
                ? Region.US_EAST_1 
                : Region.of(regionStr);

        var s3Builder = S3Client.builder()
                .credentialsProvider(StaticCredentialsProvider.create(credentials))
                .region(region)
                .forcePathStyle(true);

        var presignerBuilder = S3Presigner.builder()
                .credentialsProvider(StaticCredentialsProvider.create(credentials))
                .region(region);

        if (r2Properties.getEndpoint() != null && !r2Properties.getEndpoint().isBlank()) {
            URI endpointUri = URI.create(r2Properties.getEndpoint());
            s3Builder.endpointOverride(endpointUri);
            presignerBuilder.endpointOverride(endpointUri);
        }

        this.s3Client = s3Builder.build();
        this.s3Presigner = presignerBuilder.build();
    }

    public void uploadFile(String objectKey, byte[] fileBytes, String contentType) {
        if (!r2Properties.isEnabled()) {
            throw new IllegalStateException("R2 Storage is currently disabled.");
        }
        if (s3Client == null) {
            initClients();
        }

        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(r2Properties.getBucketName())
                .key(objectKey)
                .contentType(contentType)
                .build();

        s3Client.putObject(putObjectRequest, RequestBody.fromBytes(fileBytes));
    }

    public byte[] downloadFileBytes(String objectKey) {
        if (!r2Properties.isEnabled()) {
            throw new IllegalStateException("R2 Storage is currently disabled.");
        }
        if (s3Client == null) {
            initClients();
        }

        GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                .bucket(r2Properties.getBucketName())
                .key(objectKey)
                .build();

        ResponseBytes<GetObjectResponse> objectBytes = s3Client.getObjectAsBytes(getObjectRequest);
        return objectBytes.asByteArray();
    }

    public String generatePresignedGetUrl(String objectKey, int ttlSeconds, String originalFileName, boolean isDownload) {
        if (!r2Properties.isEnabled()) {
            throw new IllegalStateException("R2 Storage is currently disabled.");
        }
        if (s3Presigner == null) {
            initClients();
        }

        String disposition = isDownload ? "attachment" : "inline";
        String contentDisposition = originalFileName != null && !originalFileName.isBlank()
                ? String.format("%s; filename=\"%s\"", disposition, originalFileName.replaceAll("[^A-Za-z0-9._-]", "_"))
                : disposition;

        GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                .bucket(r2Properties.getBucketName())
                .key(objectKey)
                .responseContentDisposition(contentDisposition)
                .build();

        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(Duration.ofSeconds(ttlSeconds))
                .getObjectRequest(getObjectRequest)
                .build();

        PresignedGetObjectRequest presignedRequest = s3Presigner.presignGetObject(presignRequest);
        return presignedRequest.url().toString();
    }

    public void deleteFile(String objectKey) {
        if (!r2Properties.isEnabled()) {
            return;
        }
        if (s3Client == null) {
            initClients();
        }

        DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                .bucket(r2Properties.getBucketName())
                .key(objectKey)
                .build();

        s3Client.deleteObject(deleteObjectRequest);
    }
}
